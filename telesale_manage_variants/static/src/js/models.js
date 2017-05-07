odoo.define('telesale_manage_variants.models2', function (require) {
"use strict";
var TsModels = require('telesale.models');
var OrderSuper = TsModels.Order
// var Backbone = window.Backbone;

var TsModelSuper = TsModels.TsModel
TsModels.TsModel = TsModels.TsModel.extend({
    // Fetch order template from server
    load_server_data: function(){
        var self=this;
        var loaded = TsModelSuper.prototype.load_server_data.call(this,{})
        var template_fields = ['name', 'display_name', 'product_variant_ids', 'product_variant_count']
        var template_domain = [['sale_ok','=',true]]
        // FIX; NOT RENDER DATAWIDGET AT TIME?
        loaded = self.fetch('product.template', template_fields, template_domain)
            .then(function(templates){
                self.db.add_templates(templates);

                // Set names list to autocomplete
                self.set('template_names', [])
                for (var key in templates){
                    var tmp = templates[key]
                    self.get('template_names').push(tmp.display_name);
                }
            });
        return TsModelSuper.prototype.load_server_data.call(this,{})
    },

   _get_product_fields: function(){
        var res = TsModelSuper.prototype._get_product_fields.call(this,{});
        res.push('product_tmpl_id');
        return res
    },

    // OVERWRITED TO LET NOT HAVE PRODUCT IF PRODUCT VARIANT LINE
    get_line_vals: function(line, order_model){
        // No product setted, fail in super
        var res = {}
        if (line.mode == 'template_variants'){
            res = {
                ts_model: this, 
                order:order_model,
                code: "" ,
                product:'',
                unit:'',
                qty: 0.0,
                pvp: 0.0,
                discount: 0.0,
                taxes_ids:[],
            }
        }
        else{
            res = TsModelSuper.prototype.get_line_vals.call(this, line, order_model);
        }

        // Add fields to manage variant lines
        var new_vals = {
             mode: line.mode || 'template_single',
             template: line.template || '',
             parent_cid: line.parent_cid || "",
             variant_related_cid: line.variant_related_cid || {}
        }
        $.extend(res, new_vals)
        return res
    },

    build_order_create_lines: function(order_model, order_lines){
        var model_by_tmpl_id = {}
        for (var key in order_lines){
            var line = order_lines[key];

            var prod_obj = this.db.get_product_by_id(line.product_id[0]);
            var template_id = prod_obj.product_tmpl_id[0];
            var template_obj = this.db.template_by_id[template_id];

            var to_add = {
                mode: 'template_single',
                template: template_obj.display_name,
                parent_cid: "",
                variant_related_cid: {}
            }
            if (template_obj.product_variant_count > 1){
                if ( !_.has(model_by_tmpl_id, template_obj.id) ){
                     var template_line_vals = {
                        mode: 'template_variants',
                        variant_related_cid: {},
                        template: template_obj.display_name,
                        product: '',
                        parent_cid: "",
                     }
                     // Create template line
                     $.extend(line, template_line_vals);
                     var line_vals = this.get_line_vals(line, order_model)
                     model_by_tmpl_id[template_obj.id] = new TsModels.Orderline(line_vals);
                     order_model.get('orderLines').add(model_by_tmpl_id[template_obj.id]);
                }
                var template_model = model_by_tmpl_id[template_obj.id];


                // Create variant line
                to_add.mode = 'variant';
                to_add.parent_cid = template_model.cid

                $.extend(line, to_add);
                var line_vals = this.get_line_vals(line, order_model)
                var line = new TsModels.Orderline(line_vals);

                // PROBAR A AÑADIR TODOS EN ARRAY
                order_model.get('orderLines').add(line);

                // Update structure for grid
                template_model.variant_related_cid[prod_obj.id] = line.cid
            }
            else{
                $.extend(line, to_add);
                var line_vals = this.get_line_vals(line, order_model)
                var line = new TsModels.Orderline(line_vals);
                order_model.get('orderLines').add(line);
            }





        }
    }, 

});

// Set template to store the template name en la linea
var _initialize_ = TsModels.Orderline.prototype.initialize;
TsModels.Orderline.prototype.initialize = function(options){
    var self = this;
    this.set({
        template : options.template || ''
    });

    //template_singe: A normal line, template with one variant
    //template_variants: Grouping line with special grouping behavior
    //variant: Line created with the grid, parent line is a template_variants
    this.mode = options.mode || 'template_single'
    this.parent_cid = options.parent_cid || undefined;
    this.variant_related_cid = options.variant_related_id || {};
    return _initialize_.call(this, options);
}

//Overwrited to not fail when product empty if is a template grouping line
TsModels.Orderline.prototype.check = function(){
    var res = true
    if ( this.mode != "template_variants" && this.get('product') == "" ) {
       res = false;
    }
    return res
}

TsModels.Orderline.prototype.get_line_model_by_cid = function(line_cid){
    var current_order = this.ts_model.get('selectedOrder');
    var line_model = current_order.get('orderLines').get({cid: line_cid}); 
    return line_model;
},


// Function to get template obj from model (Extend is not working)
TsModels.Orderline.prototype.get_template = function(){
    var template_name = this.get('template');
    if (this.get('template') != ""){
        var template_id = this.ts_model.db.template_name_id[template_name];
        var template_obj = this.ts_model.db.template_by_id[template_id]
        return template_obj
    }
    return false
}

var _exportJSON_ = TsModels.Orderline.prototype.export_as_JSON;
TsModels.Orderline.prototype.export_as_JSON = function(){
    var res = _exportJSON_.call(this, {});
    var to_add = {mode: this.mode,
                  cid: this.cid,
                  parent_cid: this.parent_cid}
    res = $.extend(res, to_add)
    return res
},


TsModels.Order.prototype.add_lines_to_current_order = function(order_lines, fromsoldprodhistory){
    debugger;
     this.get('orderLines').unbind();  //unbind to render all the lines once, then in OrderWideget we bind again

    if(this.selected_orderline && this.selected_orderline.get('code') == "" && this.selected_orderline.get('product') == "" ){
        $('.remove-line-button').click()
    }
    // Instead of original for bucle
    this.ts_model.build_order_create_lines(this, order_lines);
    $('.col-template').focus();

}



});
