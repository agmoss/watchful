import arg from 'arg';
import inquirer from 'inquirer';
import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import urlChecker from "./main";
import Table from 'cli-table3';


const collectInputs = async (inputs = []) => {
    const prompts = {
        type: 'input',
        name: `url`,
        message: 'Enter a url to check: '
    }

    const answer = await inquirer.prompt(prompts);
    const newInputs = [...inputs, answer];

    while (answer.url !== 'done') {
        return collectInputs(newInputs)
    }
    return newInputs.filter(input => {
        return input.url !== 'done'
    })
};


export async function cli(args) {

    clear();
    console.log(
        chalk.green(
            figlet.textSync('TwoHundred', {
                horizontalLayout: 'full'
            })
        )
    );

    let inputs = await collectInputs();
    clear();

    const urls = inputs.map(input => {
        return input.url
    })
    const results = await urlChecker(urls);

    var table = new Table({
        head: ['Url', 'Status'],
        colWidths: [20, 10]
    });

    results.map(result => {
        table.push(result)
    })

    console.log(table.toString());
}