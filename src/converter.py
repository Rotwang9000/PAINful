import json
from parser import Parser

class Converter:
    def __init__(self):
        self.parser = Parser()
        self.declarations = {}
        self.relationships = []
        self.data = {}

    def load_file(self, file_path: str) -> None:
        with open(file_path, 'r') as file:
            content = file.read()
            self.parse_pain(content)

    def parse_pain(self, content: str) -> None:
        # Split on single § line
        content = '\n'.join(line.lstrip('\t').lstrip(' ') for line in content.splitlines())
        sections = content.split('\n§\n')
        if len(sections) != 2:
            raise ValueError("Invalid PAIN format: Missing section separator")
            
        declarations, relationships = sections
        self.declarations, self.relationships = self.parser.parse(content)
        self.build_data()

    def build_data(self) -> None:
        data = {}

        for rel_type, parts in self.relationships:
            if rel_type == 'assign':
                # Handle direct assignment (§1=§2)
                src, dest = parts
                src_name = self.declarations[src.replace('§', '')]
                dest_value = self.declarations[dest.replace('§', '')]
                data[src_name] = dest_value

            elif rel_type == 'array':
                # Handle array definition (§1:\n§2\n§3)
                array_name = self.declarations[parts[0].replace('§', '')]
                items = []
                # Skip first part (array name) and process items
                for item in parts[1:]:
                    if item.strip():
                        item_id = item.replace('§', '').strip()
                        if item_id in self.declarations:
                            items.append(self.declarations[item_id])
                data[array_name] = items

            elif rel_type == 'transform':
                # Handle transformations (§1->§2->§3)
                transform_chain = []
                for step in parts:
                    step_id = step.replace('§', '').strip()
                    if step_id in self.declarations:
                        transform_chain.append(self.declarations[step_id])
                if transform_chain:
                    data['pipeline'] = transform_chain

        self.data = data

    def to_json(self) -> str:
        return json.dumps(self.data, indent=2)

    def save_json(self, file_path: str) -> None:
        with open(file_path, 'w') as file:
            json.dump(self.data, file, indent=2)