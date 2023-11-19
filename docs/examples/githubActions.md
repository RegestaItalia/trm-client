# Github Actions

We’re now going to see how to integrate TRM with an ABAP CI/CD workflow in Github.

To learn more about Github Actions, visit [the official website](https://github.com/features/actions).

## Requirements

To setup TRM Github Actions you'll need:
- A Github repository
- One or more SAP systems with [trm-server](/server/docs/setup.md) installed
- A runner (or self-hosted runner) environment with
    - Node.js
    - [SAP NW RFC SDK](/client/docs/setup.md#sap-nw-rfc-sdk)
    - [R3Trans program](/client/docs/setup.md#r3trans-program)

## Self-Hoster runner

In this tutorial we're going to use [Github Self-hoster runners](https://docs.github.com/en/actions/hosting-your-own-runners), so that we're able to **access our SAP systems from Github workflows**.

To start:
1. Open your Github repository
2. Go to **Settings** > **Actions** > **Runners**
3. Press on "New self-hoster runner"
4. Select your operating system and follow the guided instructions

After finishing, you should see your self-hosted runner in an **idle state**, waiting for jobs.

# Publish from Github Actions

To publish a package from Github Actions you can use [trm-action-publish](https://github.com/marketplace/actions/trm-action-publish).

## Example workflow

# Install from Github Actions

To install a package from Github Actions you can use [trm-action-install](https://github.com/marketplace/actions/trm-action-install).

## Example workflow