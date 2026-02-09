#!/usr/bin/env python
"""
OpenAPI Schema Diff Tool

Compares baseline and current OpenAPI schemas to detect breaking changes.
Only additive changes are allowed for /api/v1.

Usage:
    python scripts/diff_openapi.py --baseline api-contracts/v1/baseline.yaml --current openapi_current.yaml --strict
"""

import argparse
import sys
import yaml
from pathlib import Path
from typing import Any


class BreakingChangeError(Exception):
    """Raised when a breaking change is detected."""
    pass


class OpenAPIDiffer:
    """Detects breaking changes between OpenAPI schemas."""
    
    def __init__(self, baseline: dict, current: dict):
        self.baseline = baseline
        self.current = current
        self.breaking_changes: list[str] = []
        self.additive_changes: list[str] = []
        self.warnings: list[str] = []
    
    def diff(self) -> bool:
        """
        Compare schemas and return True if no breaking changes found.
        """
        self._diff_paths()
        self._diff_schemas()
        return len(self.breaking_changes) == 0
    
    def _diff_paths(self):
        """Check for removed or modified endpoints."""
        baseline_paths = set(self.baseline.get('paths', {}).keys())
        current_paths = set(self.current.get('paths', {}).keys())
        
        # Removed paths = breaking
        removed = baseline_paths - current_paths
        for path in removed:
            self.breaking_changes.append(f"REMOVED PATH: {path}")
        
        # New paths = additive (OK)
        added = current_paths - baseline_paths
        for path in added:
            self.additive_changes.append(f"NEW PATH: {path}")
        
        # Check methods on existing paths
        for path in baseline_paths & current_paths:
            self._diff_path_methods(path)
    
    def _diff_path_methods(self, path: str):
        """Check for removed or modified HTTP methods on a path."""
        baseline_methods = set(self.baseline['paths'][path].keys())
        current_methods = set(self.current['paths'][path].keys())
        
        # Removed methods = breaking
        removed = baseline_methods - current_methods
        for method in removed:
            if method not in ('parameters', 'summary', 'description'):
                self.breaking_changes.append(f"REMOVED METHOD: {method.upper()} {path}")
        
        # Check parameters and responses
        for method in baseline_methods & current_methods:
            if method in ('parameters', 'summary', 'description'):
                continue
            self._diff_operation(path, method)
    
    def _diff_operation(self, path: str, method: str):
        """Check for breaking changes in operation parameters/responses."""
        baseline_op = self.baseline['paths'][path][method]
        current_op = self.current['paths'][path].get(method, {})
        
        # Check required parameters
        baseline_params = {p.get('name'): p for p in baseline_op.get('parameters', [])}
        current_params = {p.get('name'): p for p in current_op.get('parameters', [])}
        
        for name, param in baseline_params.items():
            if name not in current_params:
                self.breaking_changes.append(
                    f"REMOVED PARAMETER: {name} from {method.upper()} {path}"
                )
            elif param.get('required') and not current_params[name].get('required'):
                # Making required param optional is OK
                self.additive_changes.append(
                    f"RELAXED PARAMETER: {name} now optional in {method.upper()} {path}"
                )
    
    def _diff_schemas(self):
        """Check for removed or modified schema definitions."""
        baseline_schemas = self.baseline.get('components', {}).get('schemas', {})
        current_schemas = self.current.get('components', {}).get('schemas', {})
        
        # Removed schemas = breaking
        removed = set(baseline_schemas.keys()) - set(current_schemas.keys())
        for schema in removed:
            self.breaking_changes.append(f"REMOVED SCHEMA: {schema}")
        
        # New schemas = additive (OK)
        added = set(current_schemas.keys()) - set(baseline_schemas.keys())
        for schema in added:
            self.additive_changes.append(f"NEW SCHEMA: {schema}")
        
        # Check properties on existing schemas
        for schema in set(baseline_schemas.keys()) & set(current_schemas.keys()):
            self._diff_schema_properties(schema, baseline_schemas[schema], current_schemas[schema])
    
    def _diff_schema_properties(self, schema_name: str, baseline: dict, current: dict):
        """Check for removed or modified properties in a schema."""
        baseline_props = baseline.get('properties', {})
        current_props = current.get('properties', {})
        baseline_required = set(baseline.get('required', []))
        current_required = set(current.get('required', []))
        
        # Removed properties = breaking
        removed = set(baseline_props.keys()) - set(current_props.keys())
        for prop in removed:
            self.breaking_changes.append(f"REMOVED PROPERTY: {schema_name}.{prop}")
        
        # New properties = additive (OK)
        added = set(current_props.keys()) - set(baseline_props.keys())
        for prop in added:
            if prop in current_required:
                self.breaking_changes.append(
                    f"NEW REQUIRED PROPERTY: {schema_name}.{prop} (must be optional)"
                )
            else:
                self.additive_changes.append(f"NEW OPTIONAL PROPERTY: {schema_name}.{prop}")
        
        # Making optional → required = breaking
        newly_required = current_required - baseline_required
        for prop in newly_required:
            if prop in baseline_props:
                self.breaking_changes.append(
                    f"PROPERTY NOW REQUIRED: {schema_name}.{prop}"
                )
    
    def report(self) -> str:
        """Generate a diff report."""
        lines = ["=" * 60, "OpenAPI Contract Diff Report", "=" * 60, ""]
        
        if self.breaking_changes:
            lines.append("❌ BREAKING CHANGES (will fail CI):")
            for change in self.breaking_changes:
                lines.append(f"  • {change}")
            lines.append("")
        
        if self.additive_changes:
            lines.append("✅ ADDITIVE CHANGES (allowed):")
            for change in self.additive_changes:
                lines.append(f"  • {change}")
            lines.append("")
        
        if self.warnings:
            lines.append("⚠️  WARNINGS:")
            for warning in self.warnings:
                lines.append(f"  • {warning}")
            lines.append("")
        
        if not self.breaking_changes and not self.additive_changes:
            lines.append("✅ No changes detected. Schema is identical to baseline.")
        
        lines.append("=" * 60)
        return "\n".join(lines)


def load_schema(path: Path) -> dict:
    """Load an OpenAPI schema from YAML or JSON."""
    with open(path, 'r') as f:
        return yaml.safe_load(f)


def main():
    parser = argparse.ArgumentParser(description='Diff OpenAPI schemas for breaking changes')
    parser.add_argument('--baseline', required=True, help='Path to baseline schema')
    parser.add_argument('--current', required=True, help='Path to current schema')
    parser.add_argument('--strict', action='store_true', help='Exit with error on breaking changes')
    parser.add_argument('--output', help='Write report to file')
    
    args = parser.parse_args()
    
    baseline_path = Path(args.baseline)
    current_path = Path(args.current)
    
    if not baseline_path.exists():
        print(f"⚠️  Baseline schema not found: {baseline_path}")
        print("   This may be the first run. Creating baseline from current schema.")
        baseline_path.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy(current_path, baseline_path)
        print(f"   Baseline created: {baseline_path}")
        sys.exit(0)
    
    baseline = load_schema(baseline_path)
    current = load_schema(current_path)
    
    differ = OpenAPIDiffer(baseline, current)
    success = differ.diff()
    
    report = differ.report()
    print(report)
    
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
    
    if args.strict and not success:
        print("\n❌ BREAKING CHANGES DETECTED - Failing CI")
        sys.exit(1)
    
    print("\n✅ Contract validation passed")
    sys.exit(0)


if __name__ == '__main__':
    main()
