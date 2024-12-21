# README.md

# PAIN Converter

The PAIN Converter is a Python project designed to load, save, and convert a custom notation format called PAIN to JSON. This tool is useful for users who need to work with PAIN formatted data and want to easily convert it into a more widely used format like JSON.

Live conversion: https://rotwang9000.github.io/PAINful/

## Features

- Load PAIN formatted files
- Save data in PAIN format
- Convert PAIN data to JSON format

## PAIN Format Specification

PAIN (Procedural API Interaction Notation) is a simple text-based format for describing API interactions and their relationships.

### Structure
A PAIN document consists of two sections:
1. Declaration Section
2. Relationship Section
separated by a § with nothing else on the line

### Declaration Section
Each line declares a variable or result using the § symbol followed by a number:
§1 variable_name 
§2 description_or_value

### Relationship Section
Shows how declarations relate to each other using these operators:
- `=` : Direct assignment (one-to-one)
- `:` : Array/collection relationship
- `->` : Transformation/pipe operation

### Transformation Operations (->)
The transformation/pipe operator `->` allows chaining operations where output from one declaration feeds into another.

### Nested Object Notation
PAIN supports nested objects using dot notation:

{
    "users": [{
        "name": "John",
	"name": "Jones",
        "address": {
            "street": "123 Main St",
            "City": "Johnton"
        },
	"phone": "000"
	},
	{
        "name": "Mary",
        "address": {
            "street": "321 Roady Road",
            "City": "Little Johnton"
        }
}

	]
    }



§1 users 
§2 name 
§4 address 
§5 street 
§7 City 
§9 phone 
§3 Jones 
§6 123 Main St 
§8 Johnton 
§10 000 
§11 Mary 
§12 321 Roady Road 
§13 Little Johnton 
§14 John
§
§1..§2 = §14
. = §3
..§4.§5 = §6 
..§7 = §8 
...§9 = §10 
...§2 = §11 
..§4.§5 = §12 
..§7 = §13

The dots are relative to the one above, objects are closed as we leave them on the way up
\6 means 6 dots up
/6 means 6 dots from the left hand side, but still a relative style movement so only closes objects left on the left.

Examples:

1. Simple Transformation:
§1 get_user_data 
§2 validate_user 
§3 format_response 
§
§1->§2->§3

This chains operations where the output of get_user_data is passed to validate_user, and its result is passed to format_response.

2. Branching Transformations:
§1 fetch_data 
§2 transform_a 
§3 transform_b 
§4 final_result 
§
§1->§2 
§1->§3 
§2->§4 
§3->§4

This shows how one source can branch into multiple transformations that later merge.

3. Transformation with Array Input:
§1 data_source 
§2 item1 
§3 item2 
§4 process_items 
§
§1: §2 §3 
§1->§4

This demonstrates passing an array through a transformation.

Rules for ->:
- Left side must be declared before right side
- Can chain multiple transformations (§1->§2->§3)
- Can have multiple inputs to one transformation
- Transformations can be combined with other operators

### Examples

1. Simple Assignment:
§1 get_user 
§2 user_data 
§
§1=§2

2. Array Collection:
§1 list_items 
§2 item1 
§3 item2 
§4 item3 
§5 data_in
§
§1: 
 §2 
 §3 
 §4
§5=§1


### Rules
1. Declaration numbers must be unique
2. They can contain references to other declarations which can be higher numbers
3. Each relationship must reference existing declarations
4. Indentation in relationship section is optional but recommended for readability - leading tabs and spaces are ignored.
5. Following a declaraion number is either a space or a new line character which are ignored. A space followed by a new line will give a new line at the start. Data can be spread over multiple lines and stops when it gets to the next line beginning §
5. if we need to use the § symbol then it can be escaped with a \
6. Declaration and relationship sections are separated by a line with a single §



### Example JSON Output
The above PAIN notation would convert to JSON like:
```json
{
  "list_items": [
    "item1",
    "item2"
	"item3"
  ],
  "data_in": "list_items"
}



## Usage

```python
from pain_converter import PAINConverter

# Load PAIN from file
converter = PAINConverter()
pain_data = converter.load_file("example.pain")

# Convert to JSON
json_data = converter.to_json()

# Save as JSON
converter.save_json("output.json")

# Create PAIN from dict
data = {
    "get_user": {
        "name": "John",
        "age": 30
    }
}
pain_text = converter.from_dict(data)
```

## File Extension
PAIN files use the .pain extension.

## Error Handling
The converter will raise these exceptions:

PAINSyntaxError: Invalid PAIN syntax
PAINReferenceError: Reference to undefined section
PAINValidationError: Invalid relationships or structure


## Running Tests

To run the unit tests for the project, use the following command:

```
pytest
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.