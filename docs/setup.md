# TRM Client – Setup

This document guides you through the installation of all required components to run the `trm-client`.

---

## Node.js & npm

TRM client is distributed via npm.  
To install **Node.js** and **npm**, follow this official guide:

➡ [Install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm)

### Post-install Check

After installation:

- On **Windows**, verify that the following path is included in your `PATH` environment variable:  
  `C:\Users\<YOUR_USER>\AppData\Roaming\npm`

  You can check this using [this guide](https://learn.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ee537574(v=office.14)).

- Run:
  ```bash
  npm
  ```

  You should see a list of available npm commands.

---

## SAP NW RFC SDK (Optional)

> [!NOTE] 
> Starting from `trm-core@6.0.0` (December 2024), the **SAP NW RFC SDK is optional** due to the deprecation of the `node-rfc` library ([GitHub Issue #329](https://github.com/SAP/node-rfc/issues/329)).

The SDK is used only if you're connecting to SAP systems via **RFC**.

➡ [RFC SDK Installation Guide](https://github.com/SAP/node-rfc/blob/main/doc/installation.md#sap-nwrfc-sdk-installation)

### Windows Setup

1. Download the SDK from the [SAP Support Portal](https://support.sap.com/en/product/connectors/nwrfcsdk.html)
2. Create `C:\nwrfcsdk` and extract the SDK into it
3. Make sure `C:\nwrfcsdk\bin` contains required DLLs like `icudt*.dll`. If not, copy them from `bin\lib`
4. Run `rfcexec` inside the bin folder to verify functionality
5. Set `SAPNWRFC_HOME = C:\nwrfcsdk`
6. Add `C:\nwrfcsdk\bin` to your system `PATH`
7. Restart your terminal session (if open) after setting environment variables.
8. Run:
   ```bash
   npm install node-rfc -g
   ```

---

## TRM REST API Support (Optional)

Starting with `trm-core@6.0.0`, you can also connect to SAP via **REST APIs**, using [`trm-rest`](https://github.com/RegestaItalia/trm-rest).

➡ [trm-rest Installation Guide](https://github.com/RegestaItalia/trm-rest)

---

## ICU Common Library

> If you installed the [SAP NW RFC SDK](#sap-nw-rfc-sdk-optional), you can **skip this step** — the ICU libraries are already included.

To install ICU manually, extract them from the **SAPEXE** archive using **SAPCAR**.

---

### Download SAPCAR

1. Go to [SAP Software Center](https://me.sap.com/softwarecenter)
2. Click **SUPPORT PACKAGES & PATCHES**
3. Expand **By Alphabetical Index (A–Z)** and select **S**
4. Click on **SAPCAR**
5. Choose the latest version
6. Select your **operating system**

<p align="center">
  <img src="/docs/_media/sapme_os.png" alt="SAP.me OS dropdown" />
</p>

7. Download the **SAPCAR** file

---

### Download SAPEXE

1. Go back to [SAP Software Center](https://me.sap.com/softwarecenter)
2. Click **SUPPORT PACKAGES & PATCHES**
3. Expand **By Alphabetical Index (A–Z)** and click **K**
4. Select a **64-bit SAP kernel** version (e.g., *SAP KERNEL 7.89 64-BIT UNICODE*)
5. Choose your **operating system**

<p align="center">
  <img src="/docs/_media/sapme_os.png" alt="SAP.me OS dropdown" />
</p>

6. Download the **SAPEXE.SAR** file

<p align="center">
  <img src="/docs/_media/sapme_os.png" alt="SAP.me OS dropdown" />
</p>

---

### Extract ICU DLLs from SAPEXE

Run:

```bash
sapcar -xvf SAPEXE_<version>.SAR
```

---

### Windows Setup

1. Create `C:\ICU`
2. Move the following files into it:
    - `icuuc*.dll`
    - `icudt*.dll`
    - `icuin*.dll`
3. Add `C:\ICU` to your system `PATH`

---

## R3trans Program

TRM Client uses `R3trans` to unpack transport files in downloaded `.trm` packages.

> Requires either [RFC SDK](#sap-nw-rfc-sdk-optional) or [ICU Libraries](#icu-common-library) installed.

---

### Download SAPCAR

1. Go to [SAP Software Center](https://me.sap.com/softwarecenter)
2. Click **SUPPORT PACKAGES & PATCHES**
3. Expand **By Alphabetical Index (A–Z)** and select **S**
4. Click on **SAPCAR**
5. Choose the latest version
6. Select your **operating system**

<p align="center">
  <img src="/docs/_media/sapme_os.png" alt="SAP.me OS dropdown" />
</p>

7. Download the **SAPCAR** file

---

### Download R3trans

1. Go to [SAP Software Center](https://me.sap.com/softwarecenter)
2. Click **SUPPORT PACKAGES & PATCHES**
3. Expand **By Alphabetical Index (A–Z)** and click **K**
4. Choose a **64-bit SAP kernel** (e.g., *SAP KERNEL 7.89 64-BIT UNICODE*)
5. Select your **operating system**

<p align="center">
  <img src="/docs/_media/sapme_os.png" alt="SAP.me OS dropdown" />
</p>

6. Download the **R3trans.SAR** file

---

### Extract R3trans

```bash
sapcar -xvf R3trans_<version>.SAR
```

---

### Windows Setup

1. Create `C:\R3Trans`
2. Move the extracted `R3trans.exe` into that folder
3. Run:
   ```bash
   cd C:\R3Trans
   R3trans
   ```
   You should see usage output
4. Set `R3TRANS_HOME = C:\R3Trans`

---

## Install `trm-client`

> Restart your terminal session (if open) after setting environment variables.

Install globally:

```bash
npm install trm-client -g
```

Verify:

```bash
trm
```

This will show all available CLI commands.

➡ [trm-client on npm](https://www.npmjs.com/package/trm-client)

---

## Virtual System (Recommended)

SAP recommends using **Virtual Systems** to avoid leaving transports stuck in queues.

- Set this up on your **central development system**
- Each TRM release should target the virtual system

➡ [SAP Guide – Virtual System Setup](https://help.sap.com/doc/saphelp_nw73ehp1/7.31.19/en-us/44/b4a0db7acc11d1899e0000e829fbbd/content.htm?no_cache=true)

> Setup should be done by your BASIS team