# <a href="https://docs.trmregistry.com/#/server/README"><img src="https://docs.trmregistry.com/logo.png" height="40" alt="TRM"></a>

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-1.3.0-4baaaa.svg)](https://github.com/RegestaItalia/trm-docs/blob/main/CODE_OF_CONDUCT.md)
[![trm-client License](https://img.shields.io/github/license/RegestaItalia/trm-client)](https://github.com/RegestaItalia/trm-client)
[![trm-client Latest version](https://img.shields.io/npm/v/trm-client)](https://www.npmjs.com/package/trm-client)
[![trm-client Installs](https://img.shields.io/npm/dt/trm-client)](https://www.npmjs.com/package/trm-client)

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



<!-- END OF SETUP.MD -->

---

# Contributing

Like every other TRM open-source projects, contributions are always welcomed ❤️.

Make sure to open an issue first.

Contributions will be merged upon approval.

[Click here](https://docs.trmregistry.com/#/CONTRIBUTING) for the full list of TRM contribution guidelines.

[<img src="https://trmregistry.com/public/contributors?image=true">](https://docs.trmregistry.com/#/?id=contributors)
