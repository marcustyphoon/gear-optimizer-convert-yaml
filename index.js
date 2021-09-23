/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import fs from 'fs/promises';
import yaml from 'js-yaml';

const convert = async function () {
  const files = await fs.readdir('./data');

  // temp
  let count = 0;

  for (const fileName of files) {
    console.log('\n', fileName);
    const fileData = await fs.readFile(`./data/${fileName}`);
    const data = yaml.load(fileData);

    for (const section of data.list) {
      if (!section.items) break;

      for (const item of section.items) {
        // temp
        count++;
        if (count > 60) return;

        console.log('\n  ', item.id);

        const newModifiers = {};

        const parsedModifiersArray = Object.entries(JSON.parse(item.modifiers));
        for (const [type, modifiers] of parsedModifiersArray) {
          for (const [attribute, value] of Object.entries(modifiers)) {
            console.log('  ', type, attribute, value);
          }
        }
      }
    }

    let resultYaml = yaml.dump(data, {
      forceQuotes: true,
      lineWidth: -1,
      flowLevel: 5
    });
    console.log(resultYaml.slice(0, 300), '\n');
    // resultYaml = resultYaml.replace(/\n/g, '\n\n').replace(/\n\n    /g, '\n    ')
    // fs.writeFileSync(base.src + 'yaml/' + mode + '.yaml', resultYaml, 'utf8');
  }
};

convert();
