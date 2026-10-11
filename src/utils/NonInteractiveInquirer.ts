import { Inquirer, Question } from "trm-commons";

type IInquirer = typeof Inquirer.inquirer;

/**
 * Inquirer used while prompts are disabled (--no-prompts).
 * A question that would be asked takes its default; without a default, the command stops
 * with an error naming the missing value instead of waiting for an answer.
 */
export class NonInteractiveInquirer implements IInquirer {

    constructor(private readonly base: IInquirer, private readonly hint: string) { }

    public async prompt(arg1: Question | Question[]): Promise<any> {
        const questions = Array.isArray(arg1) ? arg1 : [arg1];
        const answers: any = {};
        for (const question of questions as any[]) {
            const when = typeof question.when === 'function' ? await question.when(answers) : question.when;
            if (when === false) {
                continue;
            }
            const value = typeof question.default === 'function' ? await question.default(answers) : question.default;
            if (value === undefined || value === null || value === '') {
                throw new Error(`"${question.message}" (${question.name}) is required when interactive prompts are disabled (--no-prompts). ${this.hint}`);
            }
            answers[question.name] = value;
        }
        return answers;
    }

    public setPrefix(text: string): void {
        this.base.setPrefix(text);
    }

    public removePrefix(): void {
        this.base.removePrefix();
    }

    public getPrefix(): string {
        return this.base.getPrefix();
    }

    public isUi(): boolean {
        return false;
    }

}
