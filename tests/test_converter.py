import unittest
import json
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from converter import Converter

class TestConverter(unittest.TestCase):
    def setUp(self):
        self.converter = Converter()
        self.test_file = 'test.pain'
        self.output_file = 'output.json'

    def tearDown(self):
        # Clean up test files
        for file in [self.test_file, self.output_file]:
            if os.path.exists(file):
                os.remove(file)

    def test_load_file_and_convert_assignment(self):
        content = """
        §1 get_user
        §2 user_data
§
        §1=§2
        """
        with open(self.test_file, 'w') as f:
            f.write(content)
        
        self.converter.load_file(self.test_file)
        result = json.loads(self.converter.to_json())
        self.assertEqual(result['get_user'], 'user_data')

    def test_load_file_and_convert_array(self):
        content = """
        §1 items
        §2 item1
        §3 item2
§
        §1:
        §2
        §3
        """
        with open(self.test_file, 'w') as f:
            f.write(content)
        
        self.converter.load_file(self.test_file)
        result = json.loads(self.converter.to_json())
        
        print(result)
        
        self.assertEqual(result['items'], ['item1', 'item2'])

    def test_load_file_and_convert_transform(self):
        content = """
        §1 input
        §2 process
        §3 output
§
        §1->§2->§3
        """
        with open(self.test_file, 'w') as f:
            f.write(content)
        
        self.converter.load_file(self.test_file)
        result = json.loads(self.converter.to_json())
        self.assertEqual(result['pipeline'], ['input', 'process', 'output'])

    def test_save_json(self):
        content = """
        §1 test
        §2 value
§
        §1=§2
        """
        with open(self.test_file, 'w') as f:
            f.write(content)
        
        self.converter.load_file(self.test_file)
        self.converter.save_json(self.output_file)
        
        self.assertTrue(os.path.exists(self.output_file))
        with open(self.output_file, 'r') as f:
            data = json.load(f)
            self.assertEqual(data['test'], 'value')

if __name__ == '__main__':
    unittest.main()