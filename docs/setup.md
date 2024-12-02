# trm-client Requirements

This documentation will guide you through the installation of the required software in order to run trm-client.

## Node.Js & Npm

To install both NodeJs and npm, follow [this guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm).


After installing NodeJs and npm, make sure to have the following environment variable set in your system:
- Windows

    - [Open the Enviroment Variables settings and view the PATH variable](https://learn.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ee537574(v=office.14))

    - Check if the path `C:\Users\<<YOUR_USER>>\AppData\Roaming\npm` is in the list, if not, add it

Running the command `npm` in your system CLI should output all of the possible commands.

## SAP NW RFC SDK (Optional)

> [!NOTE]  
> As of trm-core 6.0.0 (December 2024), SAP NW RFC SDK has become optional in TRM installation. This comes with the end of the support of node-rfc library ([#329](https://github.com/SAP/node-rfc/issues/329)).

TRM Client communicates with SAP systems through RFC.

For this reason, it's necessary to have the RFC SDK installed on your system.

A guide on installing the SDK can be found [here](https://github.com/SAP/node-rfc/blob/main/doc/installation.md#sap-nwrfc-sdk-installation).

To sum up the installation:

- Download the RFC SDK from the SAP® Support Portal (follow the updated link of the note in [this section](https://support.sap.com/en/product/connectors/nwrfcsdk.html?anchorId=section_1291717368))

- On Windows

    1. Create the folder `C:\nwrfcsdk`
      
    2. Place the content downloaded into this folder (extract if needed)

    3. Make sure `C:\nwrfcsdk\bin` exists

    Make sure the libraries are also included in the bin folder (`C:\nwrfcsdk\bin\icudt5x.dll` ...), if not, copy the content of the folder `C:\nwrfcsdk\bin\lib` into `C:\nwrfcsdk\bin`

    Running the command `rfcexec` through cmd, in the folder `C:\nwrfcsdk\bin`, should list the mandatory fields of the command

    4. Create an enviroment variable named `SAPNWRFC_HOME`, with the path `C:\nwrfcsdk`

    5. Add `C:\nwrfcsdk\bin` to the PATH environment variable
    
    6. Run the command `npm install node-rfc -g`
    
## ICU common library

If you installed the [SAP NW RFC SDK](#SAP-NW-RFC-SDK-Optional) you can **skip this step**, as the library should be already provided with the SDK.

Start by downloading **SAPCAR** (for more information refer to SAP Note [212876](https://me.sap.com/notes/212876)), which will be used for unpacking SAPEXE.

> SAPCAR is a utility used by SAP to compress and/or uncompress SAP archive files (SAR: SAP Archive)

1. Go to [Software downloads in SAP for Me](https://me.sap.com/softwarecenter)
2. Click the **SUPPORT PACKAGES & PATCHES** section
3. Expand the **By Alphabetical Index (A-Z)** section
4. Click the **S** letter
5. Click the **SAPCAR** element of the list
6. Select the highest available version
7. Select your operating system
8. Click the element you want to download

Now, download **SAPEXE**

1. Go to [Software downloads in SAP for Me](https://me.sap.com/softwarecenter)
2. Click the **SUPPORT PACKAGES & PATCHES** section
3. Expand the **By Alphabetical Index (A-Z)** section
4. Click the **K** letter
5. Select a 64bit kernel
6. Select your operating system
7. Click on the SAPEXE element you want to download

After downloading SAPCAR and SAPEXE, unpack its content with the command

`sapcar -xvf <SAPEXE file>.SAR`

- On Windows

    1. Create the folder `C:\ICU`

    2. Move the ICU common library dlls (icuuc5*x*.dll, icudt5*x*.dll, icuin5*x*.dll) into that folder

    3. Add `C:\ICU` to the PATH environment variable
    
- On Linux

    1. Create the folder `C:\ICU`

    2. Move the ICU common library files (libicuuc5*x*.so, libicudata5*x*.so, libicui18n5*x*.so) into that folder

    3. Create an enviroment variable named `LD_LIBRARY_PATH`, with the path `C:\ICU`

## R3trans program

For this step, installing [SAP NW RFC SDK](#SAP-NW-RFC-SDK-Optional) or having the [ICU common library](#ICU-common-library) is necessary.

The R3trans program is used by TRM Client to unpack the packages downloaded from a registry.

Start by downloading **SAPCAR** (for more information refer to SAP Note [212876](https://me.sap.com/notes/212876)), which will be used for unpacking the R3trans program.

> SAPCAR is a utility used by SAP to compress and/or uncompress SAP archive files (SAR: SAP Archive)

1. Go to [Software downloads in SAP for Me](https://me.sap.com/softwarecenter)
2. Click the **SUPPORT PACKAGES & PATCHES** section
3. Expand the **By Alphabetical Index (A-Z)** section
4. Click the **S** letter
5. Click the **SAPCAR** element of the list
6. Select the highest available version
7. Select your operating system
8. Click the element you want to download

To download the **R3trans** program:

1. Go to [Software downloads in SAP for Me](https://me.sap.com/softwarecenter)
2. Click the **SUPPORT PACKAGES & PATCHES** section
3. Expand the **By Alphabetical Index (A-Z)** section
4. Click the **K** letter
5. Select a 64bit kernel
6. Select your operating system
7. Click on the R3trans element you want to download

After downloading SAPCAR and R3trans, unpack the program with the command

`sapcar -xvf <R3trans file>.SAR`

- On Windows

    1. Create the folder `C:\R3Trans`

    2. Place the extracted content into this folder

    3. Make sure `C:\R3Trans\R3trans.exe` exists
    
    Running the command `R3trans` through cmd, in the folder `C:\R3Trans`, should list possible commands

    4. Create an enviroment variable named `R3TRANS_HOME`, with the path `C:\R3Trans`

# trm-client Install

For this step, installing [all of the requirements](#trm-client-requirements) is necessary.

> Before executing this step, it's recommended to close and reopen the CLI (if the same instance was used for setting environment variables, they might be ineffective until reloading).

Run this command in your system CLI:

`npm install trm-client -g`

this will install the [trm-client package](https://www.npmjs.com/package/trm-client) in your system.

If all of the requirements are installed, running the command

`trm`

in your CLI should output all of the possible commands.

# trm-rest (Optional)

As of trm-core 6.0.0 (December 2024), it is now possible to connect to an SAP system through REST APIs.

> trm-rest is the porting/exposure of the legacy RFC trm-server functions in REST APIs. 

Install guide for trm-rest can be found [here](https://github.com/RegestaItalia/trm-rest).

# Virtual System (Recommended)

It's highly recommended to make use of Virtual Systems in order to release transports without worrying about leaving them in queues.

Ideally, you should setup the Virtual System on your central development system, and every time you publish, the Virtual System should be targeted.

Here's a guide on how to [setup a Virtual System](https://help.sap.com/doc/saphelp_nw73ehp1/7.31.19/en-us/44/b4a0db7acc11d1899e0000e829fbbd/content.htm?no_cache=true).

The setup should be performed by your BASIS team.
