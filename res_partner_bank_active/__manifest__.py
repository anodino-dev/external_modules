# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2016
#    Comunitea Servicios Tecnológicos (http://www.comunitea.com)
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published
#    by the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
{
    "name" : "Active Partner Bank Accounts",
    "description": """
       Allows to deactive partner bank accounts
    """,
    "version" : "10.0.1.0.0",
    "author" : "Comunitea",
    "website": "http://www.comunitea.com",
    "depends" : ["base"],
    "category" : "Accounting",
    "data" : ["views/res_partner_bank_view.xml"],
    'installable': True,
}
