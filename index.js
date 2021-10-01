/* eslint-disable no-regex-spaces */
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-template */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import fs from 'fs/promises';
import yaml from 'js-yaml';

const multiplierConvertDamage = {
  'Effective Power': ['Strike Damage', 'mult'],
  'Effective Health': ['Damage Reduction', 'unknown'],
  'Effective Condition Damage': ['Condition Damage', 'mult'],
  'add: Effective Condition Damage': ['Condition Damage', 'add'],
  'add: Effective Power': ['Strike Damage', 'add'],
  'target: Effective Condition Damage': ['Condition Damage', 'target'],
  'target: Effective Power': ['Strike Damage', 'target'],
  
  'Critical Damage': ['Critical Damage', 'unknown'],

  'Burning Damage': ['Burning Damage', 'unknown'],
  'Bleeding Damage': ['Bleeding Damage', 'unknown'],
  'Poison Damage': ['Poison Damage', 'unknown'],
  'Torment Damage': ['Torment Damage', 'unknown'],
  'Confusion Damage': ['Confusion Damage', 'unknown'],
};
const multiplierConvertPercent = {
  'Effective Healing': 'Outgoing Healing',
};
const attrbuteConvert = {
  'Health': 'Maximum Health',
};
const points = [
  'Power',
  'Precision',
  'Toughness',
  'Vitality',
  'Ferocity',
  'Condition Damage',
  'Expertise',
  'Concentration',
  'Healing Power',
  'Agony Resistance',
  'Armor',
];

const round = (num) => Number(Math.round(num + 'e4') + 'e-4');

// const addPlus = (value) => (value > 0 ? '+' + value : String(value));

const convert = async function () {
  const files = await fs.readdir('./data');

  // temp
  // let count = 0;

  for (const fileName of files) {
    console.log('\n', fileName);
    const fileData = await fs.readFile(`./data/${fileName}`);
    console.time(fileName);
    let data = yaml.load(fileData);
    console.timeEnd(fileName);

    // flatten list
    data = data.list;

    for (const section of data) {
      if (!section.items) section.items = [];

      for (const item of section.items) {
        // temp
        // count++;
        // if (count > 60) return;

        // console.log('\n  ', item.id);

        const newModifiers = {
          damage: {},
          attributes: {},
          conversion: {},
        };

        const parsedModifiersArray = Object.entries(JSON.parse(item.modifiers));
        for (const [type, modifiers] of parsedModifiersArray) {
          // eslint-disable-next-line prefer-const
          for (let [attribute, value] of Object.entries(modifiers)) {
            // console.log('  ', type, attribute, value);
            switch (type) {
              case 'multiplier':
                if (Object.keys(multiplierConvertDamage).includes(attribute)) {
                  const newAttrData = multiplierConvertDamage[attribute];
                  // damage
                  newModifiers.damage[newAttrData[0]] = [
                    ...(newModifiers.damage[newAttrData[0]] || []),
                    round(value * 100) + '%',
                    newAttrData[1],
                  ];
                } else {
                  // percent
                  if (value < 1) value *= 100;
                  const newAttr = multiplierConvertPercent[attribute];
                  if (newModifiers.attributes[newAttr]) throw newModifiers.attributes[newAttr];
                  newModifiers.attributes[newAttr] = round(value) + '%';
                }

                break;
              case 'buff':
              case 'flat':
                let newAttr = attribute;
                if (attrbuteConvert[attribute]) newAttr = attrbuteConvert[attribute];

                if (points.includes(attribute)) {
                  // statpoints
                  const isConv = type === 'buff' ? 'buff' : 'converted';
                  if (newModifiers.attributes[newAttr]) throw newModifiers.attributes[newAttr];
                  newModifiers.attributes[newAttr] = [value, isConv];
                } else {
                  // percent
                  if (value < 1) value *= 100;
                  if (newModifiers.attributes[newAttr]) throw newModifiers.attributes[newAttr];
                  newModifiers.attributes[newAttr] = round(value) + '%';
                }
                break;
              case 'convert':
                // console.log('  ', type, attribute, value);
                const sources = Object.entries(value);
                const result = {};
                for (const [source, amount] of sources) {
                  result[source] = round(amount * 100) + '%';
                }
                if (newModifiers.conversion[attribute]) throw newModifiers.conversion[attribute];
                newModifiers.conversion[attribute] = result;
                break;
              default:
                throw type;
            }
          }
        }

        // remove empty keys
        let realNewModifiers = {};
        for (const [key, value] of Object.entries(newModifiers)) {
          if (Object.keys(value).length) {
            realNewModifiers[key] = value;
          }
        }

        // add note for bountiful oil
        if (item.id === 'bountiful-maintenance-oil') {
          realNewModifiers = {
            'conversion': {
              'Outgoing Healing': {
                'Healing Power': '0.006%',
                'Concentration': '0.008%',
              },
            },
          };
        }

        // console.log(JSON.stringify(realNewModifiers, null, 2));

        item.modifiers = realNewModifiers;

        // clean up leftover crap in yaml
        delete item.extraCSS;
        delete item['default-enabled'];
        if (item.text) item.text = item.text.replace(/<.*>/g, '').trim();

        // eslint-disable-next-line no-prototype-builtins
        if (item.hasOwnProperty('gw2-id')) {
          item.gw2id = item['gw2-id'];
          delete item['gw2-id'];
        }
      }
    }

    let resultYaml = yaml.dump(data, {
      // forceQuotes: true,
      lineWidth: -1,
      flowLevel: 6, // fileName.includes('utility') ? 7 : 6
    });

    // add spacing
    // resultYaml = resultYaml.replace(/\n/g, '\n\n').replace(/\n\n        /g, '\n        ');
    resultYaml = resultYaml
      .replace(/\n    - id/g, '\n\n    - id')
      .replace(/\n- section/g, '\n\n- section');

    // id key to dictionary (changed my mind about this actually)
    // resultYaml = resultYaml.replace(/    - id: (.*)/gm, '    $1:')

    // console.log(resultYaml /* .slice(0, 300) */, '\n');
    fs.writeFile(`./data2/${fileName}`, resultYaml, { encoding: 'utf8', flag: 'w+' });

    // const fileData = await fs.readFile(`./data/${fileName}`);
  }
};

convert();
