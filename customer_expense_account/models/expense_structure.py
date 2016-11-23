# -*- coding: utf-8 -*-
# © 2016 Comunitea - Javier Colmenero <javier@comunitea.com>
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
from openerp import models, fields
from expense_type import COMPUTE_TYPES


class ExpenseStructure(models.Model):
    _name = 'expense.structure'

    name = fields.Char('Name', required=True)
    element_ids = fields.One2many('expense.structure.elements', 'structure_id',
                                  string="Elements")
    company_id = fields.Many2one('res.company', 'Company', required=True,
                                 default=lambda self:
                                 self.env['res.company'].
                                 _company_default_get('expense.structure'))


class ExpenseStructureElements(models.Model):
    _name = 'expense.structure.elements'
    _rec_name = 'expense_type_id'
    _order = 'sequence'

    structure_id = fields.Many2one('expense.structure', 'Structure')
    sequence = fields.Integer('Sequence', require=True)
    expense_type_id = fields.Many2one('expense.type', 'Expense Type',
                                      required=True)
    compute_type = fields.Selection(COMPUTE_TYPES, 'Compute Type',
                                    required=True,
                                    readonly=True,
                                    default='analytic',
                                    related='expense_type_id.compute_type')
    ratio = fields.Float('Ratio')
    parent_id = fields.Many2one('expense.structure.elements', 'Element')
