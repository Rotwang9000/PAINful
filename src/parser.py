import re
from typing import Dict, List, Tuple, Optional

class Parser:
    def __init__(self):
        self.declarations = {}
        self.relationships = []
        
    def parse(self, content: str) -> Tuple[Dict, List]:
        self.declarations = {}
        self.relationships = []
        
        if(not content):
            return self.declarations, self.relationships
        
        # remove leading/trailing whitespace
        content = '\n'.join(line.lstrip('\t').lstrip(' ') for line in content.splitlines())
        
        
        # Split into sections using single § line
        sections = content.split('\n§\n')
        if len(sections) != 2:
            print(sections)
            raise ValueError("Invalid PAIN format: Missing section separator")
            
        self._parse_declarations(sections[0])
        self._parse_relationships(sections[1])
        
        return self.declarations, self.relationships
        
    def _parse_declarations(self, content: str) -> None:
        current_decl = None
        current_value = []
        
        for line in content.split('\n'):
            line = line.rstrip()
            
            # Handle new declaration
            if line.startswith('§') and not line.startswith(r'\§'):
                # Save previous declaration if exists
                if current_decl:
                    self.declarations[current_decl] = '\n'.join(current_value).strip()
                
                # Parse new declaration
                match = re.match(r'§(\d+)\s*(.*)$', line)
                if match:
                    current_decl = match.group(1)
                    initial_value = match.group(2)
                    current_value = [initial_value]
                continue
                
            # Continue previous declaration
            if current_decl and line:
                current_value.append(line)
                
        # Save last declaration
        if current_decl:
            self.declarations[current_decl] = '\n'.join(current_value).strip()
            
    def _parse_relationships(self, content: str) -> None:
        current_array = None
        array_items = []
        
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            # Handle direct assignment
            if '=' in line:
                parts = [p.strip() for p in line.split('=')]
                self.relationships.append(('assign', parts))
                continue
                
            # Handle transformations
            if '->' in line:
                parts = [p.strip() for p in line.split('->')]
                self.relationships.append(('transform', parts))
                continue
                
            # Handle array start
            if ':' in line:
                if current_array:
                    self.relationships.append(('array', [current_array] + array_items))
                current_array = line.split(':')[0].strip()
                array_items = []
                continue
                
            # Handle array items
            if line.startswith('§') and current_array:
                array_items.append(line.strip())
                
        # Save last array if exists
        if current_array:
            self.relationships.append(('array', [current_array] + array_items))