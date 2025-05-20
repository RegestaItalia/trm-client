# Hello World!

In this demo, we'll install the sample package [hello-world](https://www.trmregistry.com/#/package/hello-world).

This package includes a simple report that prints a "Hello World" message when executed.

You can view the package’s source code in its GitHub repository:  
➡ [RegestaItalia/trm-hello-world](https://github.com/RegestaItalia/trm-hello-world)

> This package is the perfect starting point to see TRM in action.

---

# Part 1: Install

## Prerequisites

To follow this demo, you’ll need:

- An ECC/S/4HANA development system with a user authorized to create developments
- [trm-server](https://docs.trmregistry.com/#/server/README) installed on the SAP system
- [trm-client](https://docs.trmregistry.com/#/client/README) installed on your machine

## Installing

The `hello-world` package is publicly available on the [TRM Public Registry](https://trmregistry.com/#/package/hello-world).

To install it, run the install command:

```bash
trm install hello-world
```

You’ll be prompted through a few setup steps:

### 1. System Connection

Select how to connect to your development system.  
For this demo, choose **Manual input** and enter the connection details and credentials.

### 2. SAP Package Name

Once connected, TRM will fetch the package from the registry.  
You'll then be prompted to name the SAP devclass (package) where the content will be installed.

For the demo, use a temporary devclass:  
**`$TRM_HELLOWORLD`**

TRM will now install the `hello-world` package into your system.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_install.png" />
</p>

You can view the package in transaction `SE80` and run the report `ZTRM_HELLOWORLD` using `SE38`.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_install_se80.png" />
</p>

---

## List and View Commands

### `list`

Use the [`list` command](https://docs.trmregistry.com/#/client/commands?id=list-packages-in-a-system) to see all TRM packages installed in your system.

```bash
trm list
```

Connect to your system when prompted. You’ll get a list of installed packages.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_list.png" />
</p>

### `view`

Use the [`view` command](https://docs.trmregistry.com/#/client/commands?id=view-package-on-a-system) to get details like manifest values and current version.

```bash
trm view hello-world
```

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_view.png" />
</p>

Notice how TRM compares the installed version with the latest available from the registry.

---

### Demo

<p align="center">
  <img src="https://docs.trmregistry.com/_media/install.gif" />
</p>

---

# Part 2: TRM in Your Landscape

Once a package is installed, it's typically transported across your SAP landscape (DEV → QUA → PRD).

## Prerequisites

Complete [Part 1](#part-1-install) and ensure you have at least one additional system (e.g., QUA).

> Make sure to install `hello-world` into a **non-temporary** package (not starting with `$`) so it can be transported.

You can reinstall the package using a different devclass if needed.

### Do I need `trm-server` in all systems?

No. Only your **development system** requires `trm-server`.  
Subsequent transports through QUA/PRD are done **manually**, without needing `trm-server`.

---

## Transporting

TRM automatically creates a transport request during installation.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_reinstall.png" />
</p>

> If you've lost the log, check transaction `SE01`.

Ensure your transport settings (layer/target system) are correct, then:

1. Release and import the transport into QUA.
2. Run the `list` or `view` command against the QUA system.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_view_after_transport.png" />
</p>

Even without `trm-server`, TRM can still detect the installed package via its metadata.

---

## Compare Command

Use the [`compare` command](https://docs.trmregistry.com/#/client/commands?id=compare-package-between-multiple-systems) to compare versions of the same package across multiple systems:

```bash
trm compare hello-world
```

Connect to both DEV and QUA when prompted.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_compare.png" />
</p>

You should see both systems have the same version installed.

> Try comparing other packages too!

---

# Bonus: Install with Dependencies

Now let’s install the [`trm-dependant`](https://www.trmregistry.com/#/package/trm-dependant) package.

This package contains a report that calls a method from another TRM package: [`trm-dependency`](https://www.trmregistry.com/#/package/trm-dependency).

➡ Source code:  
- [trm-dependant](https://github.com/RegestaItalia/trm-dependant)  
- [trm-dependency](https://github.com/RegestaItalia/trm-dependency)

> This is a great way to see how TRM handles dependencies.

---

## Installing

Run the install command:

```bash
trm install trm-dependant
```

You'll enter the connection details as before.

This time, TRM will detect a dependency (`trm-dependency`) and prompt you to confirm installation.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_dependency_install.png" />
</p>

TRM will install the dependency first, then continue with the main package.

---

## Verifying

Run:

```bash
trm list
```

You should now see both `trm-dependency` and `trm-dependant` installed.

---

## Transporting with Dependencies

In `SE01`, you’ll find two transport requests — one per package:

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_dependency_se01.png" />
</p>

To transport correctly:

- Import `trm-dependency` **before** `trm-dependant`,  
  **or** create a **transport of copies** including both sets of objects.

---

You're now ready to start using TRM in real development projects!