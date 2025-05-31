---
title: Install & Setup
---

## Install agno

We highly recommend:

- Installing `agno` using `pip` in a python virtual environment.

<Steps>
  <Step title="Create a virtual environment">
    <CodeGroup>

    ```bash Mac
    python3 -m venv ~/.venvs/agno
    source ~/.venvs/agno/bin/activate
    ```

    ```bash Windows
    python3 -m venv agnoenv
    agnoenv/scripts/activate
    ```

    </CodeGroup>

  </Step>
  <Step title="Install agno">
    Install `agno` using pip

    <CodeGroup>

    ```bash Mac
    pip install -U agno
    ```

    ```bash Windows
    pip install -U agno
    ```

    </CodeGroup>

  </Step>
</Steps>

<br />

<Note>

If you encounter errors, try updating pip using `python -m pip install --upgrade pip`

</Note>

---

## Upgrade agno

To upgrade `agno`, run this in your virtual environment

```bash
pip install -U agno --no-cache-dir
```

---

## Setup Agno

Log-in and connect to agno.com using `ag setup`

```bash
ag setup
```
