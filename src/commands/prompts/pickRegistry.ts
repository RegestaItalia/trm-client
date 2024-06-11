import { Inquirer } from "trm-core";
import { RegistryAlias } from "../../registryAlias";

export async function pickRegistry(): Promise<RegistryAlias> {
    var registryAlias: RegistryAlias;

    //generate public alias if it doesn't exist
    RegistryAlias.generatePublicRegistryAlias();

    const allAliases = RegistryAlias.getAll();
    if (allAliases.length === 1) {
        registryAlias = RegistryAlias.get(allAliases[0].alias);
    } else {
        const inq1 = await Inquirer.prompt({
            type: "list",
            name: "alias",
            message: `Choose registry`,
            choices: allAliases.map(o => {
                return {
                    name: o.alias,
                    value: o.alias
                }
            })
        });
        registryAlias = RegistryAlias.get(inq1.alias);
    }

    return registryAlias;
}