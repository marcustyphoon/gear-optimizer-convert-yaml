/* eslint-disable no-regex-spaces */
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-template */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import fs from 'fs/promises';
import yaml from 'js-yaml';

const convert = async function () {
  const files = await fs.readdir('./data');

  // temp
  // let count = 0;

  for (const fileName of files) {
    // console.log('\n', fileName);
    const fileData = await fs.readFile(`./data/${fileName}`);
    const allData = yaml.load(fileData);

    const outputData = {
      'traits': {},
      'skills': {},
      'extras': {},
    };

    // pass 1: split up
    const allExtras = {};
    for (const section of allData.list) {
      const className = section.class;
      allExtras[className] = [];
      for (const build of section.builds) {
        const { name, traits } = build;
        const data = JSON.parse(traits);
        const extrasData = JSON.stringify(data.extras, null, 2);
        allExtras[className].push(extrasData);
      }
    }

    // pass 2: find duplicates
    const duplicatesSet = new Set();
    for (const key of Object.keys(allExtras)) {
      for (const extra of allExtras[key]) {
        const { [key]: discarded, ...rest } = allExtras;

        for (const [otherkey, otherExtras] of Object.entries(rest)) {
          if (otherExtras.includes(extra)) {
            duplicatesSet.add(extra);
          }
        }
      }
    }
    // console.log(Array.from(duplicatesSet));
    const generic = Array.from(duplicatesSet).map((extrasData, index) => ({
      name: 'generic' + index,
      value: extrasData,
    }));
    // console.log(generic);

    outputData.extras.generic = generic;

    for (const section of allData.list) {
      const className = section.class;

      outputData.traits[className] = [];
      outputData.skills[className] = [];
      outputData.extras[className] = [];

      for (const build of section.builds) {
        const { name, traits } = build;
        const data = JSON.parse(traits);

        for (const type of ['traits', 'skills']) {
          if (data[type].skills && data[type].skills.length === 0) {
            // nothin
          } else {
            const thisData = JSON.stringify(data[type], null, 2);

            outputData[type][className].push({ name, value: thisData });
            build[type] = name;
          }
        }

        const extrasData = JSON.stringify(data.extras, null, 2);

        if (duplicatesSet.has(extrasData)) {
          const { name: foundName } = generic.find(({ value }) => value === extrasData);
          build.extras = foundName;
        } else {
          build.extras = name;
          outputData.extras[className].push({ name, value: extrasData });
        }
        //   const index = extrasMap.size;
        //   extrasMap.set(extrasData, index);
        //   build.extras = `extras${index}`;
        // } else {
        //   build.extras = `extras${extrasMap.get(extrasData)}`;
        // }
      }
    }

    // const traitsOutput = {
    //   'GraphQL ID': 'presetTraits',
    //   'list': [],
    // };

    // const skillsOutput = {
    //   'GraphQL ID': 'presetTraits',
    //   'list': [],
    // };

    // const extrasOutput = {
    //   'GraphQL ID': 'presetTraits',
    //   'list': [],
    // };

    // outputData.extras = Object.fromEntries(
    //   Array.from(extrasMap.entries()).map(([a, b]) => [`extras${b}`, a]),
    // );

    for (const type of ['traits', 'skills', 'extras']) {
      let resultYaml = yaml.dump(outputData[type], {
        // forceQuotes: true,
        lineWidth: -1,
        flowLevel: 6, // fileName.includes('utility') ? 7 : 6
      });

      fs.writeFile(`./data2/${type}.yaml`, resultYaml, { encoding: 'utf8', flag: 'w+' });
    }

    let resultYaml = yaml.dump(allData, {
      // forceQuotes: true,
      lineWidth: -1,
      flowLevel: 6, // fileName.includes('utility') ? 7 : 6
    });

    // add spacing
    // resultYaml = resultYaml.replace(/\n/g, '\n\n').replace(/\n\n        /g, '\n        ');
    resultYaml = resultYaml.replace(/\n  - /g, '\n\n  - ').replace(/\n      - /g, '\n\n      - ');

    // id key to dictionary (changed my mind about this actually)
    // resultYaml = resultYaml.replace(/    - id: (.*)/gm, '    $1:')

    // console.log(resultYaml /* .slice(0, 300) */, '\n');
    fs.writeFile(`./data2/${fileName}`, resultYaml, { encoding: 'utf8', flag: 'w+' });

    // const fileData = await fs.readFile(`./data/${fileName}`);
  }
};

convert();
