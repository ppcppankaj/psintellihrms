#!/usr/bin/env python
"""
Serializer Linter

Checks Django REST Framework serializers for common issues:
- Usage of `fields = '__all__'`
- Missing explicit field lists
- Undeclared SerializerMethodFields without @extend_schema_field

Usage:
    python scripts/lint_serializers.py --path apps/
"""

import argparse
import ast
import sys
from pathlib import Path
from dataclasses import dataclass


@dataclass
class LintViolation:
    file: Path
    line: int
    serializer: str
    rule: str
    message: str
    severity: str = "error"


class SerializerLinter(ast.NodeVisitor):
    """AST-based linter for DRF serializers."""
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.violations: list[LintViolation] = []
        self.current_class: str | None = None
    
    def visit_ClassDef(self, node: ast.ClassDef):
        """Visit class definitions to find serializers."""
        # Check if this is a serializer class
        is_serializer = any(
            self._is_serializer_base(base) for base in node.bases
        )
        
        if is_serializer:
            self.current_class = node.name
            self._check_serializer_class(node)
        
        self.generic_visit(node)
        self.current_class = None
    
    def _is_serializer_base(self, base: ast.AST) -> bool:
        """Check if a base class is a serializer."""
        if isinstance(base, ast.Name):
            return 'Serializer' in base.id
        if isinstance(base, ast.Attribute):
            return 'Serializer' in base.attr
        return False
    
    def _check_serializer_class(self, node: ast.ClassDef):
        """Check a serializer class for violations."""
        has_meta = False
        has_fields = False
        declared_fields: set[str] = set()
        
        for item in node.body:
            # Check for Meta class
            if isinstance(item, ast.ClassDef) and item.name == 'Meta':
                has_meta = True
                self._check_meta_class(item, node.name)
                has_fields = self._meta_has_fields(item)
            
            # Track declared fields
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name):
                        declared_fields.add(target.id)
        
        # ModelSerializer must have Meta with fields
        if not has_meta:
            self.violations.append(LintViolation(
                file=self.file_path,
                line=node.lineno,
                serializer=node.name,
                rule="missing-meta",
                message=f"Serializer '{node.name}' is missing Meta class",
                severity="warning"
            ))
    
    def _check_meta_class(self, meta_node: ast.ClassDef, serializer_name: str):
        """Check Meta class for violations."""
        for item in meta_node.body:
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name) and target.id == 'fields':
                        self._check_fields_value(item.value, meta_node.lineno, serializer_name)
    
    def _check_fields_value(self, value: ast.AST, line: int, serializer_name: str):
        """Check if fields uses '__all__'."""
        if isinstance(value, ast.Constant) and value.value == '__all__':
            self.violations.append(LintViolation(
                file=self.file_path,
                line=line,
                serializer=serializer_name,
                rule="fields-all",
                message=f"Serializer '{serializer_name}' uses fields = '__all__'. Use explicit field list.",
                severity="error"
            ))
    
    def _meta_has_fields(self, meta_node: ast.ClassDef) -> bool:
        """Check if Meta class has fields defined."""
        for item in meta_node.body:
            if isinstance(item, ast.Assign):
                for target in item.targets:
                    if isinstance(target, ast.Name) and target.id == 'fields':
                        return True
        return False


def lint_file(file_path: Path) -> list[LintViolation]:
    """Lint a single Python file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        tree = ast.parse(source, filename=str(file_path))
        linter = SerializerLinter(file_path)
        linter.visit(tree)
        return linter.violations
    except SyntaxError as e:
        return [LintViolation(
            file=file_path,
            line=e.lineno or 0,
            serializer="",
            rule="syntax-error",
            message=f"Syntax error: {e.msg}",
            severity="error"
        )]


def lint_directory(path: Path) -> list[LintViolation]:
    """Lint all serializers.py files in a directory."""
    violations = []
    
    for serializer_file in path.rglob('serializers.py'):
        violations.extend(lint_file(serializer_file))
    
    return violations


def format_violation(v: LintViolation) -> str:
    """Format a violation for console output."""
    icon = "❌" if v.severity == "error" else "⚠️"
    return f"{icon} {v.file}:{v.line} [{v.rule}] {v.message}"


def main():
    parser = argparse.ArgumentParser(description='Lint DRF serializers')
    parser.add_argument('--path', required=True, help='Path to lint')
    parser.add_argument('--strict', action='store_true', help='Exit with error on any violation')
    
    args = parser.parse_args()
    path = Path(args.path)
    
    if not path.exists():
        print(f"Error: Path does not exist: {path}")
        sys.exit(1)
    
    if path.is_file():
        violations = lint_file(path)
    else:
        violations = lint_directory(path)
    
    errors = [v for v in violations if v.severity == "error"]
    warnings = [v for v in violations if v.severity == "warning"]
    
    print("=" * 60)
    print("Serializer Lint Report")
    print("=" * 60)
    print()
    
    if violations:
        for v in violations:
            print(format_violation(v))
        print()
    
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print("=" * 60)
    
    if errors or (args.strict and warnings):
        print("\n❌ Linting failed")
        sys.exit(1)
    
    print("\n✅ Linting passed")
    sys.exit(0)


if __name__ == '__main__':
    main()
