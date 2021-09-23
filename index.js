/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import fs from 'fs/promises';
import yaml from 'js-yaml';

const convert = async function () {
  const files = await fs.readdir('./data');

  for (const fileName of files) {
    const fileData = await fs.readFile(`./data/${fileName}`);
    const data = yaml.load(fileData);

    console.log(JSON.stringify(data, null, 2).slice(0, 120));


    // let resultYaml = yaml.dump(result, {
    //   forceQuotes: true,
    //   lineWidth: -1,
    //   flowLevel: 4
    // });
    // resultYaml = resultYaml.replace(/\n/g, '\n\n').replace(/\n\n    /g, '\n    ')
    // fs.writeFileSync(base.src + 'yaml/' + mode + '.yaml', resultYaml, 'utf8');
  }
}

convert();