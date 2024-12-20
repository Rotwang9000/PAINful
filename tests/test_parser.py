import unittest
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from parser import Parser

class TestParser(unittest.TestCase):
    def setUp(self):
        self.parser = Parser()

    def test_parse_declarations(self):
        content = """
        §1 get_user
        §2 user_data
        §
        """
        declarations, _ = self.parser.parse(content)
        self.assertEqual(declarations['1'], 'get_user')
        self.assertEqual(declarations['2'], 'user_data')

    def test_parse_assignment(self):
        content = """
        §1 get_user
        §2 user_data
        §
        §1=§2
        """
        _, relationships = self.parser.parse(content)
        self.assertEqual(relationships[0], ('assign', ['§1', '§2']))

    def test_parse_array(self):
        content = """
        §1 items
        §2 item1
        §3 item2
        §
        §1:
        §2
        §3
        """
        _, relationships = self.parser.parse(content)
        self.assertEqual(relationships[0], ('array', ['§1', '§2', '§3']))

    def test_parse_transform(self):
        content = """
        §1 input
        §2 process
        §3 output
        §
        §1->§2->§3
        """
        _, relationships = self.parser.parse(content)
        self.assertEqual(relationships[0], ('transform', ['§1', '§2', '§3']))

    def test_empty_content(self):
        content = ""
        declarations, relationships = self.parser.parse(content)
        self.assertEqual(declarations, {})
        self.assertEqual(relationships, [])

if __name__ == '__main__':
    unittest.main()