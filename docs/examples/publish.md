# Publish TRM Packages

In this tutorial, you'll learn how to publish a TRM package to a registry.

---

## Prerequisites

To publish a package, ensure you have the following:

- [TRM Client](/client/docs/setup.md) installed on your computer  
  - Logged into the [Public Registry](https://docs.trmregistry.com/#/registry/public/authentication) or a custom registry

- A development system with:
  - [TRM Server](/server/docs/setup.md) installed
  - A custom Z-package containing development objects

---

## Login

> This step may be skipped depending on the registry configuration.

If you haven’t logged into your registry yet, open your terminal and run the [login command](/client/docs/commands.md#login):

```bash
trm login
```

If prompted, select your desired registry.

To confirm you're logged in, run:

```bash
trm whoami
```

This will display the currently authenticated user.

---

## Publish

You’re now ready to publish your custom development package.

Run the [publish command](/client/docs/commands.md#publish-package-from-a-system):

```bash
trm publish <<PACKAGE_NAME>>
```

Replace `<<PACKAGE_NAME>>` with your desired TRM package name.  
In this example, we’ll use: `@simonegaffurini/test-publish`

You’ll be guided through the following steps:

### System Connection

Choose how to connect to your SAP system.  
For this tutorial, select **Manual input** and provide your connection details and logon credentials.

### SAP Devclass

Enter the name of your SAP devclass (e.g., `ZMY_PACKAGE`) that contains the objects to publish.

### Transport Request Target

TRM will generate a **transport of copies**, so a release target is required.  
It’s recommended to [use a virtual system](/client/docs/setup.md#virtual-system-recommended) as your transport target.

### Dependencies

TRM automatically checks for dependencies (other TRM packages or SAP standard objects).  
If something is missing, you’ll have the option to manually edit the list.

### Package Visibility

Choose whether the package should be public or private.

> Note: The public registry (in its current alpha stage) **only supports public packages**. Private packages require a paid plan.

### Manifest

On first publish, you’ll be prompted to enter optional manifest fields:
- Description
- Authors and contact info
- License type

The package will now be published.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_publish.png" />
</p>

---

### Versioning

Since this is the first publish, **version `1.0.0`** is automatically assigned.  
If no version is specified:

- First-time publish → `1.0.0`
- Subsequent publish → latest version patch is incremented

You can verify the result on the [TRM Public Registry](https://trmregistry.com) by searching for your package.

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_publish_registry.png" />
</p>

---

### Demo

<p align="center">
  <img src="https://docs.trmregistry.com/_media/publish.gif" />
</p>

---

# Packages with Dependencies

When publishing a package, TRM automatically checks for dependencies between:
- Other TRM packages
- SAP standard objects

If any TRM dependencies are found, they’re automatically added to the package manifest.  
During installation, all required dependencies will be installed as well.

> Note: Automatic detection depends on the object type.  
> Refer to the [dependency recognition table](https://docs.trmregistry.com/#/commons/dependencies?id=dependency-recognition) for details.

---

## Example: Publish with Dependencies

Let’s say you are publishing **Package A**, which depends on a class inside **Package B**.  
But Package B hasn’t been published yet.

In this case:
- **Package A** is the **dependent**
- **Package B** is the **dependency**

If you try to publish Package A first, you’ll get an error:

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_dependency_error.png" />
</p>

The error means you must publish Package B **before** publishing Package A.

After publishing Package B, re-publishing Package A will succeed, and TRM will automatically detect the dependency:

<p align="center">
  <img src="https://docs.trmregistry.com/_media/sample_dependency_success.png" />
</p>

The dependency is then included in the manifest:

```json
"dependencies": [
  {
    "name": "trm-dependency",
    "version": "^1.0.0",
    "integrity": "..."
  }
]
```

---

You're now ready to publish and manage real packages using TRM!
