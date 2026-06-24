import chalk from "chalk";

const logger = {
  info: (msg) => console.log(chalk.blue("ℹ"), msg),
  success: (msg) => console.log(chalk.green("✔"), msg),
  warn: (msg) => console.warn(chalk.yellow("⚠"), msg),
  error: (msg) => console.error(chalk.red("✖"), msg),
  box: (msg) => {
    console.log(
      chalk.cyan("=================================================="),
    );
    console.log(chalk.cyan(msg));
    console.log(
      chalk.cyan("=================================================="),
    );
  },
  header: (msg) => console.log(chalk.bold(`\n${msg}\n`)),
};

export default logger;
