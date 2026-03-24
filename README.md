# <a href="https://docs.trmregistry.com/#/server/README"><img src="https://docs.trmregistry.com/logo.png" height="40" alt="TRM"></a>

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-1.3.0-4baaaa.svg)](https://github.com/RegestaItalia/trm-docs/blob/main/CODE_OF_CONDUCT.md)
[![trm-client License](https://img.shields.io/github/license/RegestaItalia/trm-client)](https://github.com/RegestaItalia/trm-client)
[![trm-client Latest version](https://img.shields.io/npm/v/trm-client)](https://www.npmjs.com/package/trm-client)
[![trm-client Installs](https://img.shields.io/npm/dt/trm-client)](https://www.npmjs.com/package/trm-client)
[![View Code Wiki](https://assets.codewiki.google/readme-badge/static.svg)](https://codewiki.google/github.com/regestaitalia/trm-docs)

| 🚀 This project is funded and maintained by 🏦  | 🔗                                                             |
|-------------------------------------------------|----------------------------------------------------------------|
| Regesta S.p.A.                                  | [https://www.regestaitalia.eu/](https://www.regestaitalia.eu/) |
| Clarex S.r.l.                                   | [https://www.clarex.it/](https://www.clarex.it/)               |

[trm-client](https://www.npmjs.com/package/trm-client) is the CLI implementation of the core functionalities of TRM.

🚚 **TRM (Transport Request Manager)** is a package manager inspired solution built leveraging CTS that simplifies SAP ABAP transports.

<p align="center">
  <img src="https://docs.trmregistry.com/logo.png" alt="TRM Logo" />
</p>

TRM introduces **package-based software delivery** to the SAP ecosystem, bringing with it semantic versioning, dependency management, and automated deployment activities.

---

# What is TRM?

TRM is a software that transforms how custom ABAP developments are published, installed, and maintained across SAP landscapes.
Inspired by modern package managers, TRM introduces a declarative, version-controlled, and automated way to manage your SAP transports.

With TRM, you can:

- **Define a manifest** for each ABAP package (similar to `package.json` with Node.js or `pom.xml` with Maven)
- **Version your products** ([SemVer](https://semver.org/) compliance)
- **Declare dependencies** (to other TRM packages, SAP standard objects, or customizing data)
- **Automate post-install activities**, such as client dependant customizing, cache invalidation etc.
- **Validate system requirements** prior to installation
- **Compare versions** of the same product across multiple SAP systems (in or outside the same landscape)
- **Distribute** your product release to the public or to a restricted number of users:
  - Registry (e.g., [trmregistry.com](https://trmregistry.com) or private registry)
  - Local `.trm` files for offline installations

## Modern approach for ABAP

- Publish ABAP packages from a **central development system**
- Deliver packages to target systems (outside of the original landscape e.g. customers development system) using a single CLI command (or in a pipeline)
- Full support for **workbench objects**, **customizing**, and **translations**

## Structured Manifest

Each package includes a `manifest.json` that declares:

- Version and metadata
- System requirements
- Dependencies
- Post-install scripts

# Documentation

Full documentation can be seen at [https://docs.trmregistry.com/](https://docs.trmregistry.com).

---

<!-- START OF SETUP.MD -->

# Dockerized version (Recommended)

If you are using [Docker](https://www.docker.com/), the recommended approach is to use [trm-docker](https://github.com/RegestaItalia/trm-docker).

## Download Docker Run Script

This script is a small utility used to run TRM inside Docker. After installing the required SAP proprietary tools, the script can be moved into a directory included in your `PATH` so that it can be executed from anywhere.

1. Go to the [trm-docker repository](https://github.com/RegestaItalia/trm-docker)
2. Download the script corresponding to your operating system:
   - **Windows**: download [win.cmd](https://raw.githubusercontent.com/RegestaItalia/trm-docker/refs/heads/main/win.cmd) and rename it to `trm.cmd`
   - **macOS / Linux**: download [macos](https://raw.githubusercontent.com/RegestaItalia/trm-docker/refs/heads/main/macos), rename it to `trm`, and make it executable:
     ```bash
     chmod +x trm
     ```
3. In the same directory where you placed the script, create a folder named `init`.

This `init` folder will later contain the SAP proprietary files required by TRM.

## Download SAPCAR and SAPEXE and Extract Required Files

SAPCAR is used to extract `.SAR` archives downloaded from SAP Software Center.

### Download SAPCAR

1. Log in to the [SAP Software Center](https://me.sap.com/softwarecenter)
2. Click **SUPPORT PACKAGES & PATCHES**
3. Expand **By Alphabetical Index (A–Z)** and select **S**
4. Click **SAPCAR**
5. Choose the **latest version**
6. On the download page select your operating system:
   - **WINDOWS ON X64 64BIT**
   - **MACOS ON ARM64BIT**
   - **MACOS X 64-BIT**
7. Download:
   - **Windows** → latest `.EXE`
   - **macOS** → latest `.ZIP`
8. If using macOS, extract the archive and make the binary executable:
   ```bash
   chmod +x SAPCAR
   ```

### Download SAP Kernel Files

1. Go back to **SUPPORT PACKAGES & PATCHES**
2. Expand **By Alphabetical Index (A–Z)** and select **K**
3. Click **SAP KERNEL 64-BIT**
4. Choose the **latest version**
5. On the download page select **LINUX ON X86_64 64BIT**
6. Download the latest **SAPEXE** archive  
   (file name similar to `SAPEXE_###-########.SAR`)

### Extract the Required Files

1. Place the downloaded `SAPEXE_*.SAR` file in the same directory as `SAPCAR`.
2. Extract it:

   **Windows**
   ```bash
   SAPCAR -xvf SAPEXE_###-########.SAR
   ```

   **macOS / Linux**
   ```bash
   ./SAPCAR -xvf SAPEXE_###-########.SAR
   ```

3. After extraction, move the following files into the previously created `init` folder:

   ```
   R3trans
   libicudata##.so
   libicui18n##.so
   libicuuc##.so
   ```

4. *(Optional)* If you want RFC functionality available in TRM, also move the following files into the `init` folder:

   ```
   startrfc
   rfcexec
   libsapnwrfc.so
   libsapucum.so
   ```

## Pull docker image

Execute this command to pull the latest docker image

```bash
docker pull --platform=linux/amd64 abaptrm/docker
```

## Initial Installation via Script

Once the `init` folder is populated and the `trm` script is ready, run the script from the directory where it is located.

**Windows**
```bash
trm
```

**macOS / Linux**
```bash
./trm
```

The first execution performs the initial setup of the Docker environment.\
After the installation completes, you may move the script to a directory included in your system `PATH` so it can be executed from anywhere.

**Windows**
```
C:\Windows\System32
```

**macOS / Linux**
```
/usr/local/bin
```

After this step, you can simply run:

```bash
trm
```

from any directory.

---

# Install via Npm

With [Node.js and npm](https://nodejs.org/en/download) installed, you can install [trm-client](https://www.npmjs.com/package/trm-client) via npm, as it is distributed as a Node.js package.

## TODO

<!-- END OF SETUP.MD -->

---

# Contributing

Like every other TRM open-source projects, contributions are always welcomed ❤️.

Make sure to open an issue first.

Contributions will be merged upon approval.

[Click here](https://docs.trmregistry.com/#/CONTRIBUTING) for the full list of TRM contribution guidelines.

[<img src="https://trmregistry.com/public/contributors?image=true">](https://docs.trmregistry.com/#/?id=contributors)
