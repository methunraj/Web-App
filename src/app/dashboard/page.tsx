'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Sigma, BarChart3, CheckCircle, AlertCircle, DollarSign, AlertTriangle, FileClock } from "lucide-react";
import { useJob } from "@/contexts/JobContext";
import { useConfiguration } from "@/contexts/ConfigurationContext";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { JobResult } from "@/types";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const {
    isProcessingQueue,
    jobResults,
    totalFilesToProcess,
    processedFilesCount,
    failedFilesCount,
    jobQueue,
    currentTask: jobContextCurrentTask, // Renamed to avoid conflict
    useCaching, // Check if caching is enabled
    cachePricePerMillionTokens, // Get the current price per million tokens
    cacheStats, // Get cache stats directly
    cachePricing, // Get cache pricing configuration
  } = useJob();
  const { llmConfig } = useConfiguration();
  const { pricePerMillionInputTokens, pricePerMillionOutputTokens } = llmConfig;
  const { toast } = useToast();

  const successfulExtractionsCount = jobResults.filter(job => job.status === 'success').length;
  const successPercentage = totalFilesToProcess > 0 ? Math.round((successfulExtractionsCount / totalFilesToProcess) * 100) : 0;

  // Calculate token sums from all job results
  const totalPromptTokens = jobResults.reduce((sum, job) => sum + (job.promptTokens || 0), 0);
  const totalCompletionTokens = jobResults.reduce((sum, job) => sum + (job.completionTokens || 0), 0);
  const totalEstimatedTokens = jobResults.reduce((sum, job) => sum + (job.estimatedTokens || 0), 0);
  
  // Calculate thinking tokens (total - (input + output))
  const calculateThinkingTokens = (job: JobResult): number => {
    if (job.totalTokens === undefined || 
        job.promptTokens === undefined || 
        job.completionTokens === undefined) {
      return 0;
    }
    
    const calculatedSum = job.promptTokens + job.completionTokens;
    return job.totalTokens > calculatedSum ? job.totalTokens - calculatedSum : 0;
  };
  
  const totalThinkingTokens = jobResults.reduce((sum, job) => sum + calculateThinkingTokens(job), 0);

  // Calculate token breakdown totals
  const tokenBreakdownTotals = jobResults.reduce((totals, job) => {
    if (!job.tokenBreakdown) return totals;
    
    return {
      documentTokens: (totals.documentTokens || 0) + (job.tokenBreakdown.documentTokens || 0),
      schemaTokens: (totals.schemaTokens || 0) + (job.tokenBreakdown.schemaTokens || 0),
      systemPromptTokens: (totals.systemPromptTokens || 0) + (job.tokenBreakdown.systemPromptTokens || 0),
      examplesTokens: (totals.examplesTokens || 0) + (job.tokenBreakdown.examplesTokens || 0),
      mediaTokens: (totals.mediaTokens || 0) + (job.tokenBreakdown.mediaTokens || 0),
    };
  }, { documentTokens: 0, schemaTokens: 0, systemPromptTokens: 0, examplesTokens: 0, mediaTokens: 0 });

  // For display purposes, calculate grand total based on available data
  // This gives a single number to display as "Total Tokens"
  const displayableGrandTotalTokens = jobResults.reduce((sum, job) => {
    if (job.totalTokens !== undefined) {
      // If we have the total tokens directly from the API, use that
      return sum + job.totalTokens;
    } else if (job.promptTokens !== undefined && job.completionTokens !== undefined) {
      // Otherwise, sum the parts
      return sum + job.promptTokens + job.completionTokens;
    }
    return sum + 0;
  }, 0);

  // Calculate cost with cache savings included
  let estimatedCost: number | null = null;
  let costDisplay: string;
  let costCalculationMessage = "Based on current settings & usage";
  
  // Get cache-related values with defaults
  const cachingEnabled = useCaching || false;
  const cacheHits = cacheStats?.cacheHits || 0;
  const tokensSaved = cacheStats?.tokensSaved || 0;
  const cacheStorageCost = cacheStats?.storageCost || 0;
  const cacheNetSavings = cacheStats?.netSavings || 0;

  // Add state for active caches and their expiration times
  const [activeCaches, setActiveCaches] = useState<Array<{name: string, expireTime: string, inputTokens: number}>>([]);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Calculate time remaining for each cache
  useEffect(() => {
    // Only run if caching is enabled
    if (!useCaching) return;
    
    // Fetch active caches
    const fetchCaches = async () => {
      try {
        // This would typically be replaced by an actual API call to list caches
        const caches = await fetch('/api/caches').then(res => res.json()).catch(() => []);
        setActiveCaches(caches || []);
      } catch (error) {
        console.error('Failed to fetch cache info:', error);
        setActiveCaches([]);
      }
    };
    
    fetchCaches();
    
    // Set up timer to update the countdown
    const timer = setInterval(() => {
      const now = new Date();
      const newTimeRemaining: Record<string, string> = {};
      
      activeCaches.forEach(cache => {
        const expireTime = new Date(cache.expireTime);
        const diffMs = expireTime.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          newTimeRemaining[cache.name] = 'Expired';
        } else {
          const diffMins = Math.floor(diffMs / 60000);
          const diffSecs = Math.floor((diffMs % 60000) / 1000);
          newTimeRemaining[cache.name] = `${diffMins}m ${diffSecs}s`;
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [useCaching, activeCaches]);

  // Add function to extend cache TTL
  const extendCacheTTL = async (hours: number = 1) => {
    try {
      const response = await fetch('/api/caches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'extendAll', ttlHours: hours }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "TTL Extended",
          description: result.message,
        });
        
        // Refresh cache list
        const caches = await fetch('/api/caches').then(res => res.json()).catch(() => []);
        setActiveCaches(caches || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to extend TTL",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to extend TTL:', error);
      toast({
        title: "Error",
        description: "Failed to extend TTL. See console for details.",
        variant: "destructive",
      });
    }
  };
  
  // Add function to clear all caches
  const clearAllCaches = async () => {
    try {
      const response = await fetch('/api/caches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Caches Cleared",
          description: result.message,
        });
        
        // Clear the local list
        setActiveCaches([]);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to clear caches",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
      toast({
        title: "Error",
        description: "Failed to clear caches. See console for details.",
        variant: "destructive",
      });
    }
  };

  if (totalPromptTokens === 0 && totalCompletionTokens === 0 && jobResults.every(job => !job.totalTokens || job.totalTokens === 0)) {
    // No tokens used at all across all jobs
    costDisplay = "$0.0000";
  } else if (pricePerMillionInputTokens !== undefined && pricePerMillionOutputTokens !== undefined) {
    // If we have prices, calculate cost using available prompt and completion tokens
    const rawCost = (totalPromptTokens / 1000000 * pricePerMillionInputTokens) +
                   (totalCompletionTokens / 1000000 * pricePerMillionOutputTokens) +
                   (totalThinkingTokens / 1000000 * pricePerMillionOutputTokens); // Thinking tokens use output token pricing
    
    // Include cache benefits if caching is enabled
    if (cachingEnabled && cacheNetSavings !== 0) {
      estimatedCost = rawCost - cacheNetSavings; // Subtract net savings (which accounts for storage costs)
      costDisplay = `$${estimatedCost.toFixed(4)}`;
      costCalculationMessage = "Includes cache savings & storage costs";
    } else {
      estimatedCost = rawCost;
      costDisplay = `$${estimatedCost.toFixed(4)}`;
    }

    // Check if breakdown was missing for any job that did report some total tokens
    const someJobsMissingBreakdown = jobResults.some(job =>
        (job.totalTokens && job.totalTokens > 0) &&
        (job.promptTokens === undefined || job.completionTokens === undefined)
    );

    if (someJobsMissingBreakdown && (totalPromptTokens === 0 && totalCompletionTokens === 0 && displayableGrandTotalTokens > 0)) {
         costCalculationMessage = "Input/output token breakdown missing for all jobs with tokens. Cost cannot be accurately calculated unless input/output prices are identical and total tokens are available.";
         if (pricePerMillionInputTokens === pricePerMillionOutputTokens && displayableGrandTotalTokens > 0) {
            estimatedCost = (displayableGrandTotalTokens / 1000000 * pricePerMillionInputTokens);
            costDisplay = `$${estimatedCost.toFixed(4)}`;
            costCalculationMessage = "Est. using total tokens (input/output prices are identical; breakdown unavailable)";
         } else if (displayableGrandTotalTokens > 0) {
            costDisplay = "N/A";
         }
    } else if (someJobsMissingBreakdown) {
        costCalculationMessage = "Input/output token breakdown missing for some jobs; cost is based on available data.";
    }

  } else {
    costDisplay = "Not configured";
    costCalculationMessage = "Configure pricing in LLM settings";
  }

  // For displaying token counts:
  let displayPromptTokensStr = totalPromptTokens > 0 ? totalPromptTokens.toLocaleString() : "0";
  let displayCompletionTokensStr = totalCompletionTokens > 0 ? totalCompletionTokens.toLocaleString() : "0";
  
  const hasJobsWithTokensButNoBreakdown = jobResults.some(job => (job.totalTokens && job.totalTokens > 0) && (job.promptTokens === undefined || job.completionTokens === undefined));

  if (totalPromptTokens === 0 && hasJobsWithTokensButNoBreakdown) {
    displayPromptTokensStr = "N/A*";
  }
  if (totalCompletionTokens === 0 && hasJobsWithTokensButNoBreakdown) {
    displayCompletionTokensStr = "N/A*";
  }

  if (displayPromptTokensStr.includes("N/A*") || displayCompletionTokensStr.includes("N/A*")) {
    costCalculationMessage = costCalculationMessage.includes("(*Breakdown unavailable for some files)") ? costCalculationMessage : costCalculationMessage + " (*Breakdown unavailable for some files)";
  }


  const pendingInQueueCount = jobQueue.length;
  const currentUiTask = jobContextCurrentTask; // Use the renamed variable

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedFilesCount} / {totalFilesToProcess}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed files
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Based on {totalFilesToProcess} initial files
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedFilesCount}</div>
            <p className="text-xs text-muted-foreground">
              After all retry attempts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active LLM Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isProcessingQueue && currentUiTask && currentUiTask !== "All files processed." && currentUiTask !== "Processing cancelled by user." ? '1+' : '0'}</div>
            <p className="text-xs text-muted-foreground">
              {isProcessingQueue && currentUiTask && currentUiTask !== "All files processed." && currentUiTask !== "Processing cancelled by user." ? `Processing queue... (${pendingInQueueCount} pending)` : 'Idle'}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
              <Sigma className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayableGrandTotalTokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Input: {displayPromptTokensStr}
              </p>
              <p className="text-xs text-muted-foreground">
                Output: {displayCompletionTokensStr}
              </p>
              {totalThinkingTokens > 0 && (
                <p className="text-xs text-muted-foreground">
                  Thinking: {totalThinkingTokens.toLocaleString()}
                </p>
              )}
              {totalThinkingTokens > 0 && (
                <div className="mt-1 pt-1 border-t border-muted">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Combined I/O only: {(totalPromptTokens + totalCompletionTokens).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Grand Total with Thinking: {displayableGrandTotalTokens.toLocaleString()}
                  </p>
                </div>
              )}
              {totalEstimatedTokens > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Estimated: {totalEstimatedTokens.toLocaleString()}
                  </p>
                  {Object.entries(tokenBreakdownTotals).map(([key, value]) => 
                    value > 0 ? (
                      <p key={key} className="text-xs text-muted-foreground ml-2">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Tokens', '')}: {value.toLocaleString()}
                      </p>
                    ) : null
                  )}
                </div>
              )}
              {cachingEnabled && cacheHits > 0 && (
                <div className="mt-2 pt-1 border-t border-muted">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Cache Performance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cache Hits: {cacheHits}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tokens Saved: {tokensSaved.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costDisplay}</div>
              <p className="text-xs text-muted-foreground">
                {costCalculationMessage}
              </p>
              
              {cachingEnabled && cacheHits > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Token Savings: ${(((tokensSaved || 0) / 1000000) * (isNaN(cachePricePerMillionTokens) ? 0.15 : cachePricePerMillionTokens)).toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cache Storage: ${(cacheStorageCost || 0).toFixed(6)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Net Cache Savings: ${(cacheNetSavings || 0).toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Extraction Job Log</CardTitle>
          <CardDescription>
            {jobResults.length > 0
              ? `Showing the latest ${Math.min(10, jobResults.length)} of ${jobResults.length} job events (includes retries).`
              : "An overview of your recent data extraction activities will appear here once you run jobs."}
          </CardDescription>
        </CardHeader>
        <CardContent className={jobResults.length === 0 ? "flex items-center justify-center h-64" : ""}>
          {jobResults.length === 0 ? (
            <p className="text-muted-foreground">No job history yet. Run an extraction to see results.</p>
          ) : (
            <ul className="space-y-3">
              {jobResults.slice(-10).reverse().map((job) => (
                <li key={job.jobId} className="flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-3">
                    {job.status === 'failed' ? <AlertTriangle className="h-5 w-5 text-destructive" /> :
                     job.status === 'retrying' ? <FileClock className="h-5 w-5 text-amber-500 animate-pulse" /> :
                     job.error ? <AlertCircle className="h-5 w-5 text-destructive" /> :
                     <CheckCircle className="h-5 w-5 text-green-500" />}
                    <div className="flex flex-col">
                        <span className="font-medium">{job.fileName}</span>
                        {job.totalTokens !== undefined && (
                            <span className="text-xs text-muted-foreground">Tokens: {job.totalTokens.toLocaleString()}</span>
                        )}
                        {(job.promptTokens !== undefined && job.completionTokens !== undefined && (job.promptTokens > 0 || job.completionTokens > 0) && (job.promptTokens + job.completionTokens !== job.totalTokens && job.totalTokens !== undefined && (job.promptTokens + job.completionTokens) > 0 )) && (
                             <span className="text-xs text-muted-foreground">(Input: {job.promptTokens}, Output: {job.completionTokens})</span>
                        )}
                        {job.promptTokens !== undefined && job.completionTokens !== undefined && job.totalTokens !== undefined && 
                          job.totalTokens > (job.promptTokens + job.completionTokens) && (
                            <span className="text-xs text-muted-foreground">
                              Thinking: {(job.totalTokens - (job.promptTokens + job.completionTokens)).toLocaleString()}
                            </span>
                        )}
                        {job.estimatedTokens !== undefined && job.estimatedTokens > 0 && (
                            <span className="text-xs text-muted-foreground">Est. Tokens: {job.estimatedTokens.toLocaleString()}</span>
                        )}
                        {job.tokenBreakdown && Object.values(job.tokenBreakdown).some(value => value && value > 0) && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const breakdownMsg = Object.entries(job.tokenBreakdown || {})
                                        .filter(([_, value]) => value && value > 0)
                                        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Tokens', '')}: ${value}`)
                                        .join('\n');
                                        
                                    // Add thinking tokens info if available
                                    const thinkingTokens = job.promptTokens !== undefined && 
                                                          job.completionTokens !== undefined && 
                                                          job.totalTokens !== undefined && 
                                                          job.totalTokens > (job.promptTokens + job.completionTokens) 
                                            ? job.totalTokens - (job.promptTokens + job.completionTokens)
                                            : null;
                                            
                                    const fullBreakdown = thinkingTokens 
                                        ? `${breakdownMsg}\nThinking: ${thinkingTokens}\n\nNote: Thinking tokens are billed at the same rate as output tokens.`
                                        : breakdownMsg;
                                        
                                    toast({ 
                                        title: `Token Breakdown for ${job.fileName}`, 
                                        description: fullBreakdown 
                                    });
                                }}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                View token breakdown
                            </button>
                        )}
                        {job.error && <span className="text-xs text-destructive truncate max-w-md" title={job.error}>Error: {job.error.substring(0,50)}...</span>}
                    </div>
                  </div>
                  <Badge variant={
                      job.status === 'failed' ? "destructive" :
                      job.status === 'retrying' ? "secondary" :
                      "default"
                    }
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {cachingEnabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caching Metrics</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Performance</p>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Cache Hits:</span>
                    <Badge variant="outline">{cacheHits}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Tokens Saved:</span>
                    <Badge variant="outline">{tokensSaved.toLocaleString()}</Badge>
                  </div>
                </div>
                
                {/* Add TTL Information */}
                {activeCaches.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Cache TTL (1hr default)</p>
                    <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                      {activeCaches.map(cache => (
                        <div key={cache.name} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[180px]" title={cache.name}>
                            {cache.name.substring(0, 16)}...
                          </span>
                          <Badge variant={
                            timeRemaining[cache.name] === 'Expired' ? 'destructive' :
                            timeRemaining[cache.name]?.startsWith('0m') ? 'secondary' : 'outline'
                          }>
                            {timeRemaining[cache.name] || 'Loading...'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      * Cache storage is billed at ${typeof cachePricing?.cacheStoragePricePerMillionTokensPerHour === 'number' 
                          ? cachePricing.cacheStoragePricePerMillionTokensPerHour.toFixed(2) 
                          : cachePricing?.cacheStoragePricePerMillionTokensPerHour?.default?.toFixed(2) || "1.00"}/M tokens/hour
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">Cost Analysis</p>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Token Savings:</span>
                    <Badge variant="outline">${(((tokensSaved || 0) / 1000000) * (isNaN(cachePricePerMillionTokens) ? 0.15 : cachePricePerMillionTokens)).toFixed(6)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Storage Cost:</span>
                    <Badge variant="outline">${(cacheStorageCost || 0).toFixed(6)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Net Savings:</span>
                    <Badge variant={(cacheNetSavings || 0) > 0 ? "secondary" : "destructive"}>
                      ${(cacheNetSavings || 0).toFixed(6)}
                    </Badge>
                  </div>
                </div>
                
                {/* Add Cache Refresh Controls */}
                <div className="mt-4">
                  <p className="text-sm font-semibold">Manage TTL</p>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs py-1 px-2 h-auto"
                        onClick={() => extendCacheTTL(1)}
                      >
                        Extend All (1hr)
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs py-1 px-2 h-auto"
                        onClick={() => clearAllCaches()}
                      >
                        Clear All
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      * Extend cache TTL for high-frequency extraction jobs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      * Clear caches to stop storage charges when done
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
