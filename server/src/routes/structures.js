const express = require('express');
const { getSchool, getStructures, getStructure, getAssignedUsages } = require('../services/schemeResolver');

const router = express.Router();

function structureView(structure) {
  return {
    id: structure.id,
    name: structure.name,
    totalFormula: structure.totalFormulaConfig,
    assignedTo: getAssignedUsages(structure.id),
  };
}

// GET /api/schools/:schoolId/structures
router.get('/:schoolId/structures', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });
  res.json(getStructures(schoolId).map(structureView));
});

// GET /api/schools/:schoolId/structures/:structureId
router.get('/:schoolId/structures/:structureId', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const structure = getStructure(schoolId, Number(req.params.structureId));
  if (!structure) return res.status(404).json({ error: 'Structure not found' });
  res.json(structureView(structure));
});

// Every node's children weights (or the tree's own weight relative to a
// parent) must sum to 1 (within a small tolerance) — this is the same rule
// the builder's UI shows as a live checkmark, just re-checked server-side.
function validateTree(node, path) {
  if (node.children) {
    if (!Array.isArray(node.children) || node.children.length === 0) {
      throw new Error(`"${path}" must have at least one child`);
    }
    const weightSum = node.children.reduce((sum, child) => sum + child.weight, 0);
    if (Math.abs(weightSum - 1) > 0.005) {
      throw new Error(`"${path}" children's weights must sum to 100% (currently ${Math.round(weightSum * 100)}%)`);
    }
    node.children.forEach((child, i) => validateTree(child, `${path} > ${child.label || `#${i + 1}`}`));
  } else {
    if (!Array.isArray(node.keys) || node.keys.length === 0) {
      throw new Error(`"${path}" must reference at least one component`);
    }
  }
}

// PUT /api/schools/:schoolId/structures/:structureId  { name?, totalFormula }
router.put('/:schoolId/structures/:structureId', (req, res) => {
  const schoolId = Number(req.params.schoolId);
  if (!getSchool(schoolId)) return res.status(404).json({ error: 'School not found' });

  const structure = getStructure(schoolId, Number(req.params.structureId));
  if (!structure) return res.status(404).json({ error: 'Structure not found' });

  const { name, totalFormula } = req.body;
  if (totalFormula) {
    if (totalFormula.type !== 'weightedTree' || !totalFormula.root) {
      return res.status(400).json({ error: 'totalFormula must be a weightedTree with a root node' });
    }
    try {
      validateTree(totalFormula.root, totalFormula.root.label || 'root');
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    structure.totalFormulaConfig = totalFormula;
  }
  if (name) structure.name = name;

  res.json(structureView(structure));
});

module.exports = router;
