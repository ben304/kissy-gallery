KISSY.add("gallery/chart/element-pie",function(S,Element){
    var P = S.namespace("Gallery.Chart"),
        Dom = S.DOM,
        Event = S.Event,
        darker = function(c){
            var hsl = c.hslData();
            return new P.Color.hsl(hsl[0],hsl[1],hsl[2]*0.6);
        };
    /**
     * class BarElement for Bar Chart
     */
    function BarElement(data,chart,drawcfg){
        this.data = data;
        this.chart = chart;
        this.drawcfg = drawcfg;

        this.initData(drawcfg);
        this.initEvent();

        this.current = [-1,-1];
        this.anim = new P.Anim(0.5,"easeInStrong");
        this.anim.init();
    }

    S.extend(BarElement, P.Element,{
        initData : function(cfg){
            var self      = this,
                data      = self.data,
                elemLength         = data.elements().length,
                maxlength = data.maxElementLength(),
                itemwidth = (cfg.right - cfg.left)/maxlength,
                gap = itemwidth/5/elemLength,//gap between bars
                padding = itemwidth/3/elemLength,
                barwidth = (itemwidth - (elemLength - 1) * gap - 2*padding)/elemLength,
                barheight,barleft,bartop,color,
                items = [];
            self.maxLength = maxlength;

            self.items = items;
            self.data.eachElement(function(elem,idx,idx2){
                if(!items[idx]){
                    items[idx] = {
                        _x : [],
                        _top  :  [],
                        _left  :  [],
                        _path  :  [],
                        _width  :  [],
                        _height  :  [],
                        _colors : [],
                        _dcolors : []
                    }
                }
                var element = items[idx];

                barheight = (cfg.bottom - cfg.top) * elem.data / cfg.max;
                barleft = cfg.left + idx2 * itemwidth + padding + idx * (barwidth + gap);
                bartop = cfg.bottom - barheight;

                color = P.Color(self.data.getColor(idx,"bar"));
                colord = darker(color);

                element._left[idx2] = barleft;
                element._top[idx2] = bartop;
                element._width[idx2] = barwidth;
                element._height[idx2] = barheight;
                element._path[idx2] = new P.RectPath(barleft,bartop,barwidth,barheight);
                element._x[idx2] = barleft+barwidth/2;
                element._colors[idx2] = color;
                element._dcolors[idx2] = colord;
            });

        },

        /**
         * draw the barElement
         * @param {Object} Canvas Object
         */
        draw : function(ctx){
            var self = this,
                data = self.items,
                ml = self.maxLength,
                color,gradiet,colord,chsl,
                barheight,cheight,barleft,bartop,
                //for anim
                k = self.anim.get(),
                i;

            if(self.data.config.showLabels){
                self.drawNames(ctx);
            }

            S.each(data, function(bar, idx){
                for(i = 0; i< ml; i++){
                    barleft = bar._left[i];
                    barheight = bar._height[i];
                    cheight = barheight * k;
                    bartop = bar._top[i] + barheight - cheight;
                    barwidth = bar._width[i];
                    color =    bar._colors[i];
                    dcolor =    bar._dcolors[i];

                    //draw backgraound
                    gradiet = ctx.createLinearGradient(barleft,bartop,barleft,bartop + cheight);
                    gradiet.addColorStop(0,color.css());
                    gradiet.addColorStop(1,dcolor.css());

                    ctx.fillStyle = gradiet;
                    //ctx.fillStyle = color;
                    ctx.fillRect(barleft,bartop,barwidth,cheight);
                    //draw label on the bar
                    if(ml === 1 && barheight > 25){
                        ctx.save();
                        ctx.fillStyle = "#fff";
                        ctx.font = "20px bold Arial";
                        ctx.textBaseline = "top";
                        ctx.textAlign = "center";
                        ctx.fillText(P.format(bar.data[i],bar.format), bar._x[i], bartop + 2);
                        ctx.restore();
                    }
                }

            });

            if(k < 1) {
                self.fire("redraw");
            }
        },

        initEvent : function(){
            Event.on(this.chart,"mousemove",this.chartMouseMove,this);
            Event.on(this.chart,"mouseleave",this.chartMouseLeave,this);
        },

        destory : function(){
            Event.remove(this.chart,"mousemove",this.chartMouseMove);
            Event.remove(this.chart,"mouseleave",this.chartMouseLeave);
        },

        chartMouseMove : function(ev){
            var current = [-1,-1],
                items = this.items;

            S.each(this.items, function(bar,idx){
                S.each(bar._path, function(path,index){
                    if(path.inpath(ev.x,ev.y)){
                        current = [idx,index];
                    }
                });
            });

            if( current[0] === this.current[0] &&
                current[1] === this.current[1])
            {
                return;
            }
            this.current = current;
            if(current[0] + current[1] >= 0){
                this.fire("barhover",{index:current});
                this.fire("showtooltip",{
                    top : items[current[0]]._top[current[1]],
                    left : items[current[0]]._x[current[1]],
                    message : this.getTooltip(current)
                });
            }else{
                this.fire("hidetooltip");
            }
        },
        chartMouseLeave : function(){
            this.current = [-1,-1];
        },
        /**
         * get tip by id
         * @return {object:dom}
         **/
        getTooltip : function(index){
            var self = this,
                eidx = index[0],
                didx = index[1],
                elements = self.data.elements(),
                colors = P.colors,
                container,
                elid = "tooltip"+index,
                li;
            var msg = "<div class='bartip'>"+
                "<span style='color:"+colors[eidx].c+";'>"+
                elements[eidx].items[didx].label+"</span>";
            return msg;
        }
    });

    P.BarElement = BarElement;
    return BarElement;
},{
    requires : ["./element"]
});