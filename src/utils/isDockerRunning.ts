import { exec } from "child_process";

export function isDockerRunning(): Promise<boolean> {
    return new Promise((resolve) => {
        exec("docker info", (error) => {
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}