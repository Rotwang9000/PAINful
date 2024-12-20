import re

def validate_pain_format(content: str) -> bool:
    lines = content.strip().split('\n')
    declaration_pattern = re.compile(r'^§\d+\s+\w+')
    
    # Check for at least one valid declaration
    has_declaration = any(declaration_pattern.match(line) for line in lines)
    
    # Check for at least one relationship
    has_relationship = any('=' in line or ':' in line or '->' in line for line in lines)
    
    return has_declaration and has_relationship