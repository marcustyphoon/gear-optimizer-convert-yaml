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
  'target: Effective Condition Damage': ['', 'target'],
  'target: Effective Power': ['Strike Damage', 'target'],
};
const multiplierConvertPercent = {
  'Effective Healing': 'Outgoing Healing',
  'Critical Damage': 'Critical Damage',
  'Burning Damage': 'Burning Damage',
  'Bleeding Damage': 'Bleeding Damage',
  'Poison Damage': 'Poison Damage',
  'Torment Damage': 'Torment Damage',
  'Confusion Damage': 'Confusion Damage',
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

const round = (num) => Number(Math.round(num + 'e1') + 'e-1');

const addPlus = (value) => (value > 0 ? '+' + value : String(value));

const convert = async function () {
  const files = await fs.readdir('./data');

  // temp
  let count = 0;

  for (const fileName of files) {
    console.log('\n', fileName);
    const fileData = await fs.readFile(`./data/${fileName}`);
    console.time(fileName);
    const data = yaml.load(fileData);
    console.timeEnd(fileName);

    for (const section of data.list) {
      if (!section.items) break;

      for (const item of section.items) {
        // temp
        count++;
        // if (count > 60) return;

        // console.log('\n  ', item.id);

        const newModifiers = {
          damage: {},
          attributes: {},
          conversion: {},
        };

        const parsedModifiersArray = Object.entries(JSON.parse(item.modifiers));
        for (const [type, modifiers] of parsedModifiersArray) {
          for (let [attribute, value] of Object.entries(modifiers)) {
            // console.log('  ', type, attribute, value);
            switch (type) {
              case 'multiplier':
                if (Object.keys(multiplierConvertDamage).includes(attribute)) {
                  const newAttrData = multiplierConvertDamage[attribute];
                  // damage
                  newModifiers.damage[newAttrData[0]] = [round(value * 100) + '%', newAttrData[1]];
                } else {
                  // percent
                  if (value < 1) value *= 100;
                  const newAttr = multiplierConvertPercent[attribute];
                  newModifiers.attributes[newAttr] = round(value) + '%';
                }

                break;
              case 'buff':
              case 'flat':
                let newAttr = attribute;
                if (attrbuteConvert[attribute]) newAttr = attrbuteConvert[attribute];

                if (points.includes(attribute)) {
                  // statpoints
                  const isConv = type === 'buff' ? 'unconverted' : 'converted';
                  newModifiers.attributes[newAttr] = [addPlus(value), isConv];
                } else {
                  // percent
                  if (value < 1) value *= 100;
                  newModifiers.attributes[newAttr] = round(value) + '%';
                }
                break;
              case 'convert':
                console.log('  ', type, attribute, value);
                const sources = Object.entries(value);
                const result = {};
                for (const [source, amount] of sources) {
                  result[source] = round(amount * 100) + '%';
                }
                newModifiers.conversion[attribute] = result;
                break;
              default:
                throw type;
            }
          }
        }

        const realNewModifiers = {};
        for (const [key, value] of Object.entries(newModifiers)) {
          if (Object.keys(value).length) {
            realNewModifiers[key] = value;
          }
        }

        // console.log(JSON.stringify(realNewModifiers, null, 2));

        item.modifiers = realNewModifiers;
      }
    }

    let resultYaml = yaml.dump(data, {
      forceQuotes: true,
      lineWidth: -1,
      flowLevel: 7,
    });
    resultYaml = resultYaml.replace(/\n/g, '\n\n').replace(/\n\n        /g, '\n        ');
    console.log(resultYaml/* .slice(0, 300) */, '\n');
    // fs.writeFileSync(base.src + 'yaml/' + mode + '.yaml', resultYaml, 'utf8');
  }
};

convert();
