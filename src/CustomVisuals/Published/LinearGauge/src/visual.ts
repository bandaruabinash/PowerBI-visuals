// JavaScript source code
module powerbi.extensibility.visual {
    //Model  
    import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
    interface ITooltipService {
        enabled(): boolean;
        show(options: TooltipShowOptions): void;
        move(options: TooltipMoveOptions): void;
        hide(options: TooltipHideOptions): void;
    }
    export interface iLinearGauge {
        titleLabel: string;
        subTitleLabel: string;
        showLabel: boolean;
        colorActual: string;
        colorComparison: string;
        states: number[];
        value: number;
        target: number;
        comparison: number;
        actual: number;
        percentage: number;
        min: number;
        max: number;
        trendValue1: number;
        trendValue2: number;
        actualFormat: string;
        targetFormat: string;
        trend1Format: string;
        trend2Format: string;
        minFormat: string;
        maxFormat: string;
        selector: data.Selector;
        toolTipInfo: TooltipDataItem[];
        golbalValueMin: number;
        targetSet: boolean;
    }
    export interface TooltipDataItem {
        displayName: string;
        value: string;
    }
    interface CardFormatSetting {
        showTitle: boolean;
        labelSettings: any;
        textSize: number;
        wordWrap: boolean;
    }
    //object variable which we used in customized color and text through UI options
    export var linearGaugeProps = {
        general: {
            ActualFillColor: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'ActualFillColor' },
            ComparisonFillColor: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'ComparisonFillColor' },
        },
        labels: {
            color: { objectName: 'labels', propertyName: 'color' },
            labelPrecision: { objectName: 'labels', propertyName: 'labelPrecision' },
            labelDisplayUnits: { objectName: 'labels', propertyName: 'labelDisplayUnits' },
        },
        trendlabels: {
            color: { objectName: 'labels', propertyName: 'color' },
            labelPrecision_trend: { objectName: 'labels', propertyName: 'labelPrecision' },
            labelDisplayUnits_trend: { objectName: 'labels', propertyName: 'labelDisplayUnits' },
        }
    };
    export var cardProps = {
        categoryLabels: {
            show: <DataViewObjectPropertyIdentifier>{
                objectName: 'categoryLabels',
                propertyName: 'show'
            },
            color: <DataViewObjectPropertyIdentifier>{
                objectName: 'categoryLabels',
                propertyName: 'color'
            },
            fontSize: <DataViewObjectPropertyIdentifier>{
                objectName: 'categoryLabels',
                propertyName: 'fontSize'
            },
        },
        labels: {
            color: <DataViewObjectPropertyIdentifier>{
                objectName: 'labels',
                propertyName: 'color'
            },
            labelPrecision: <DataViewObjectPropertyIdentifier>{
                objectName: 'labels',
                propertyName: 'labelPrecision'
            },
            labelDisplayUnits: <DataViewObjectPropertyIdentifier>{
                objectName: 'labels',
                propertyName: 'labelDisplayUnits'
            },
            fontSize: <DataViewObjectPropertyIdentifier>{
                objectName: 'labels',
                propertyName: 'fontSize'
            },

        },
        trendlabels: {
            color: <DataViewObjectPropertyIdentifier>{
                objectName: 'trendlabels',
                propertyName: 'color'
            },
            labelPrecision: <DataViewObjectPropertyIdentifier>{
                objectName: 'trendlabels',
                propertyName: 'labelPrecision'
            },
            labelDisplayUnits: <DataViewObjectPropertyIdentifier>{
                objectName: 'trendlabels',
                propertyName: 'labelDisplayUnits'
            },
            fontSize: <DataViewObjectPropertyIdentifier>{
                objectName: 'trendlabels',
                propertyName: 'fontSize'
            },
        },
        wordWrap: {
            show: <DataViewObjectPropertyIdentifier>{
                objectName: 'wordWrap',
                propertyName: 'show'
            },
        },
    };
    var globalminValue = 0,
        globalminLength = 0,
        globalTargetValue = 0,
        globalTargetWidth = 0;
    //Visual
    export class LinearGauge implements IVisual {
        //Variables 
        private static TooltipDisplayName: string = "Name";
        private selectionIdBuilder: ISelectionIdBuilder;
        private host: IVisualHost;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private prevDataViewObjects: any = {};
        private settings: any;
        private svg: d3.Selection<SVGElement>;
        private svgLinear: d3.Selection<SVGElement>;
        private svgLinearNext: d3.Selection<SVGElement>;
        private svgTitle: d3.Selection<SVGElement>;
        private svgSubtitle: d3.Selection<SVGElement>;
        private actual: d3.Selection<SVGElement>;
        private percentage: d3.Selection<SVGElement>;
        private dataView: DataView;
        private data: iLinearGauge;
        private min: d3.Selection<SVGElement>;
        private max: d3.Selection<SVGElement>;
        private targetText: d3.Selection<SVGElement>;
        private trendValue1: d3.Selection<SVGElement>;
        private trendValue2: d3.Selection<SVGElement>;
        private heading: d3.Selection<SVGElement>;
        private subHeading: d3.Selection<SVGElement>;
        private cardFormatSetting: CardFormatSetting;
        private cardFormatSetting_trend: CardFormatSetting;
        private metaDataColumn: DataViewMetadataColumn;
        private selectionManager: ISelectionManager;
        public static getDefaultData(): iLinearGauge {
            return {
                colorActual: 'orange',
                colorComparison: 'lightgrey',
                titleLabel: '',
                subTitleLabel: '',
                showLabel: true,
                states: [],
                min: 0,
                max: 1,
                value: 0,
                target: 0,
                comparison: 0,
                actual: 0,
                percentage: 0,
                trendValue1: 0,
                trendValue2: 0,
                actualFormat: '',
                targetFormat: '',
                minFormat: '',
                maxFormat: '',
                trend1Format: '',
                trend2Format: '',
                toolTipInfo: [],
                golbalValueMin: 10,
                targetSet: false,
                selector: null
            };
        }
        public getDefaultLabelSettings(show, labelColor, labelPrecision, format) {
            var defaultCountLabelPrecision = 0;
            var defaultDecimalLabelPrecision = 2;
            var defaultLabelColor = "#777777";
            var precision = 0;
            if (show === void 0) {
                show = false;
            }
            if (format) {
                var hasDots = powerbi.extensibility.utils.formatting.valueFormatter.format;
            }
            precision = defaultCountLabelPrecision;
            if (labelPrecision) {
                precision = labelPrecision;
            } else if (hasDots) {
                precision = defaultDecimalLabelPrecision;
            }
            return {
                show: show,
                position: 0 /* Above */,
                displayUnits: 0,
                precision: precision,
                labelColor: labelColor || defaultLabelColor,
                formatterOptions: null,
            };
        }
        public getDefaultLabelSettings_trend(show, labelColor, labelPrecision_trend, format) {
            var defaultCountLabelPrecision = 0;
            var defaultDecimalLabelPrecision = 2;
            var defaultLabelColor = "#777777";
            var precision = 0;
            if (show === void 0) {
                show = false;
            }
            if (format) {
                var hasDots = powerbi.extensibility.utils.formatting.numberFormat.getCustomFormatMetadata(format).hasDots;
            }
            precision = defaultCountLabelPrecision;
            if (labelPrecision_trend) {
                precision = labelPrecision_trend;
            } else if (hasDots) {
                precision = defaultDecimalLabelPrecision;
            }
            return {
                show: show,
                position: 0 /* Above */,
                displayUnits: 0,
                precision: precision,
                labelColor: labelColor || defaultLabelColor,
                formatterOptions: null,
            };
        }
        public getMetaDataColumn(dataView: DataView) {
            if (dataView && dataView.metadata && dataView.metadata.columns) {
                for (var i = 0, ilen = dataView.metadata.columns.length; i < ilen; i++) {
                    var column = dataView.metadata.columns[i];
                    if (column.isMeasure) {
                        this.metaDataColumn = column;
                        break;
                    }
                }
            }
        }
        public getDefaultFormatSettings(): CardFormatSetting {
            return {
                showTitle: true,
                textSize: null,
                labelSettings: this.getDefaultLabelSettings(true, 'black', 0, undefined),
                wordWrap: false,
            };
        }
        public getDefaultFormatSettings_trend(): CardFormatSetting {
            return {
                showTitle: true,
                textSize: null,
                labelSettings: this.getDefaultLabelSettings_trend(true, 'black', 0, undefined),
                wordWrap: false,
            };
        }
        //One time setup
        //First time it will be called and made the structure of your visual
        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            this.heading = d3.select(options.element)
                .append('div')
                .classed('mainTitle', true);
            this.svg = d3.select(options.element)
                .append('div')
                .classed('data_tab', true);
            this.svgLinear = this.svg
                .append('div').classed('data_tab', true);
            this.actual = d3.select(options.element)
                .append('text')
                .classed('data_total', true)
                .text('');
            this.percentage = d3.select(options.element)
                .append('text')
                .classed('data_percentage', true)
                .text('');
            this.svg = d3.select(options.element)
                .append('div')
                .classed('imagetab', true);
            this.svgLinear = this.svg
                .append('div');
            this.svgLinearNext = this.svg
                .append('div');
            this.trendValue1 = this.svgLinear
                .append('div')
                .classed('trendvalue1', true);
            this.trendValue2 = this.svgLinearNext
                .append('div')
                .classed('trendvalue2', true);
            this.svg = d3.select(options.element)
                .append('svg')
                .classed('linearSVG', true);
            this.svgLinear = this.svg
                .append('g');
            var titleLabels = this.svgLinear
                .append('g')
                .style('text-anchor', 'end');
            this.svgTitle = titleLabels
                .append('text')
                .classed('title', true);
            this.svgSubtitle = titleLabels
                .append('text')
                .attr('dy', '1em')
                .classed('subtitle', true);
            this.min = d3.select(options.element)
                .append('div')
                .classed('scale', true)
                .text(0);
            this.targetText = d3.select(options.element)
                .append('div')
                .classed('targetText', true);
        }
        //Convert the dataview into its view model
        //All the variable will be populated with the value we have passed
        public static converter(dataView: DataView): iLinearGauge {
            var data: iLinearGauge = LinearGauge.getDefaultData();
            if (!dataView.metadata || !dataView)
                return;
            var objects = dataView.metadata.objects;
            var toolTipItems = [];
            if (dataView.categorical.values == undefined)
                return;
            var actualFlag = false,
                maxFlag = false,
                values = dataView.categorical.values;
            if (values == undefined)
                return;
            if (values && dataView.metadata.columns) {
                for (var i = 0; i < values.length; i++) {
                    var col = dataView.metadata.columns[i];
                    var value = values[i].values[0] || 0;
                    if (col && col.roles) {
                        var pushToTooltips = false;
                        if (col.roles['Y']) { // we are marching the role and populating value
                            if (col.format === '\\$#,0;(\\$#,0);\\$#,0') //here we are checking the format Ex:it is a currency format
                            {
                                data.actualFormat = '$';
                            }
                            data.actual = <number>value;
                            actualFlag = true;
                            pushToTooltips = true; // pass the value as true to make it as a tooltip
                        } else if (col.roles['MinValue']) {
                            if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                data.minFormat = '$';
                            }
                            data.min = <number>value;
                        } else if (col.roles['MaxValue']) {
                            if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                data.maxFormat = '$';
                            }
                            maxFlag = true;
                            data.max = <number>value;
                        } else if (col.roles['TargetValue']) {
                            data.targetSet = true;
                            if (col.format === '\\$#,0;(\\$#,0);\\$#,0') {
                                data.targetFormat = '$';
                            }
                            data.target = <number>value;
                            pushToTooltips = true;
                        } else if (col.roles['QualitativeState1Value']) {
                            data.trendValue1 = <number>value;
                            if (col.format == '0%;-0%;0%' || col.format == '0 %;-0 %;0 %')
                                data.trend1Format = '%';
                        } else if (col.roles['QualitativeState2Value']) {
                            data.trendValue2 = <number>value;
                            if (col.format == '0%;-0%;0%' || col.format == '0 %;-0 %;0 %')
                                data.trend2Format = '%';
                        }
                        if (pushToTooltips)
                            toolTipItems.push({
                                value: value,
                                metadata: values[i]
                            });
                    }
                }
                if (!maxFlag && actualFlag && data.actual > 0) {
                    data.max = data.actual * 2;
                }
                if (data.max == 0) {
                    data.max = 1;
                }
            }
            return data; //Data object we are returning here to the update function
        }
        //Drawing the visual
        public update(options: VisualUpdateOptions) {
            this.cardFormatSetting = this.getDefaultFormatSettings();
            this.cardFormatSetting_trend = this.getDefaultFormatSettings_trend();
            var labelSettings = null;
            var labelSettings_trend = null;
            var dataView = options.dataViews[0];
            if (dataView == undefined)
                return;
            if (!dataView.metadata || !dataView)
                return;
            let settingsChanged = this.getSettings(dataView.metadata.objects);
            var value: any;
            if (dataView) {
                this.getMetaDataColumn(dataView);
                if (dataView.single) {
                    value = dataView.single.value;
                }
                if (!dataView.metadata || !dataView)
                    return;
                var dataViewMetadata = dataView.metadata;
            }
            labelSettings = this.settings;
            if (!options.dataViews || !options.dataViews[0]) return;
            var dataView = this.dataView = options.dataViews[0];
            var viewport = options.viewport; //We will get width and height from viewport object.
            this.data = LinearGauge.converter(dataView); //calling Converter function
            var maxValue = Math.max(Math.abs(this.data.target), Math.abs(this.data.value), Math.abs(this.data.comparison), Math.abs(this.data.max));
            if (this.data.states.length === 0)
                this.data.states = [Math.ceil(maxValue) / 3, (Math.ceil(maxValue) / 3) * 2, Math.ceil(maxValue)];
            var sortedRanges = this.data.states.slice().sort(d3.descending);
            var titleWidth = powerbi.extensibility.utils.formatting.textMeasurementService.measureSvgTextWidth({
                fontFamily: 'tahoma',
                fontSize: '16px',
                text: this.data.titleLabel
            });
            var showSubtitle = (this.data.subTitleLabel.length > 0);
            var subtitleWidth = powerbi.extensibility.utils.formatting.textMeasurementService.measureSvgTextWidth({
                fontFamily: 'tahoma',
                fontSize: '12px',
                text: this.data.subTitleLabel
            });
            var labelWidth = (this.data.showLabel ? Math.max(titleWidth, subtitleWidth) : 0);
            var precisionValue = 0,
                displayunitValue = 0,
                color = 'black',
                precisionValue_trend = 0,
                displayunitValue_trend = 0,
                color_trend = 'black';
            var height = viewport.height;
            var width = viewport.width - 20;
            var modHeight = height / 12;
            this.svg
                .attr({
                    'height': viewport.height / 11,
                    'width': viewport.width
                });
            if (this.data.showLabel) {
                this.svgTitle
                    .style('display', 'none')
                    .attr('transform', 'translate(-10,' + ((20) + (showSubtitle ? 0 : 10)) + ')')
                    .text(this.data.titleLabel);
                this.svgLinear.attr('transform', 'translate(' + (10) + ',5)');
                this.data.subTitleLabel = "hello";
                if (showSubtitle) {
                    this.svgSubtitle
                        .style('display', 'none')
                        .attr('transform', 'translate(-10,' + ((height / 23) + 1) + ')')
                        .text(this.data.subTitleLabel);
                } else {
                    this.svgSubtitle.style('display', 'none');
                }
            } else {
                this.svgTitle.style('display', 'none');
                this.svgSubtitle.style('display', 'none');
                this.svgLinear.attr('transform', 'translate(10,5)');
            }
            if (this.settings.markerWidth != undefined) {
                if (this.settings.markerWidth > 4) {
                    this.settings.markerWidth = 4;
                }
                else if (this.settings.markerWidth < 0) {
                    this.settings.markerWidth = 0;
                }
                precisionValue = this.settings.markerWidth
            }
            if (this.settings.lineWidth != undefined) {
                if (this.settings.lineWidth > 4) {
                    this.settings.lineWidth = 4;
                }
                else if (this.settings.lineWidth < 0) {
                    this.settings.lineWidth = 0;
                }
                precisionValue_trend = this.settings.lineWidth;
            }
            var percentageVal, actualVal, minVal, maxVal, targetVal, trend1Val, trend2Val;
            if (this.data.target === 0) {
                percentageVal = 0;
            } else {
                percentageVal = ((this.data.actual * 100) / this.data.target).toFixed(2);
            }
            //we are calculating value dynamically and using in style proerties to make component more responsive                                         
            function exponentToNumber(input) {
                var data = String(input).split(/[eE]/);
                if (data.length == 1) return data[0];
                var z = '',
                    sign = this < 0 ? '-' : '',
                    str = data[0].replace('.', ''),
                    mag = Number(data[1]) + 1;
                if (mag < 0) {
                    z = sign + '0.';
                    while (mag++) z += '0';
                    return z + str.replace(/^\-/, '');
                }
                mag -= str.length;
                while (mag--) z += '0';
                return str + z;
            }
            function newFormat(c, b) {
                var length = (typeof (c.toString().split(".")[1]) != 'undefined') ? c.toString().split(".")[1].length : 0
                var a = (typeof (c.toString().split(".")[1]) != 'undefined') ? c.toString().split(".")[1] : 0
                var beforeDecimal = c.toString().split(".")[0];
                var f = beforeDecimal;
                if (b != 0)
                    f = f + '.';
                if (length != 0 || b != 0) {
                    for (var i = 0; i < b; i++) {
                        f = f + (typeof (a[i]) != "undefined" ? a[i] : 0);
                    }
                }
                if (f <= 0 && c != 0 && b == length - 1 && b != 0) {
                    var d = a.slice(-1);
                    var e = Math.round(Number('.' + d));
                    var newString = a.substr(0, a.length - 2);
                    var formatedString = newString + e;
                    if (formatedString.length == b) {
                        if (b != 0)
                            formatedString = beforeDecimal + "." + formatedString;
                        return formatedString;
                    }
                } else if (b == 0 && a.length >= 1) {
                    f = Math.round(c);
                    return f;
                } else {
                    return f;
                }
            }
            this.settings.labelDisplayUnits
            this.settings.trendDisplayUnits
            switch (this.settings.labelDisplayUnits) {
                case 0:
                    {
                        actualVal = newFormat(this.data.actual, precisionValue);
                        minVal = newFormat(this.data.min, precisionValue);
                        targetVal = newFormat(this.data.target, precisionValue);
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = newFormat(this.data.toolTipInfo[a].value, precisionValue);
                        }
                        break;
                    }
                case 1:
                    {
                        actualVal = numberWithCommas(newFormat(this.data.actual, precisionValue));
                        minVal = numberWithCommas(newFormat(this.data.min, precisionValue));
                        targetVal = numberWithCommas(newFormat(this.data.target, precisionValue));
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = numberWithCommas(newFormat(this.data.toolTipInfo[a].value, precisionValue));
                        }
                        break;
                    }
                case 1000:
                    {
                        actualVal = newFormat((this.data.actual / 1000), precisionValue) + 'K';
                        minVal = newFormat((this.data.min / 1000), precisionValue) + 'K';
                        targetVal = newFormat((this.data.target / 1000), precisionValue) + 'K';
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000), precisionValue) + 'K').toString();
                        }
                        break;
                    }
                case 1000000:
                    {
                        actualVal = newFormat((this.data.actual / 1000000), precisionValue) + 'M';
                        minVal = newFormat((this.data.min / 1000000), precisionValue) + 'M';
                        targetVal = newFormat((this.data.target / 1000000), precisionValue) + 'M';
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000), precisionValue) + 'M').toString();
                        }
                        break;
                    }
                case 1000000000:
                    {
                        actualVal = newFormat((exponentToNumber(this.data.actual / 1000000000)), precisionValue) + 'bn';
                        minVal = newFormat((exponentToNumber(this.data.min / 1000000000)), precisionValue) + 'bn';
                        targetVal = newFormat((exponentToNumber(this.data.target / 1000000000)), precisionValue) + 'bn';
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000000), precisionValue) + 'bn').toString();
                        }
                        break;
                    }
                case 1000000000000:
                    {
                        actualVal = newFormat((exponentToNumber(this.data.actual / 1000000000000)), precisionValue) + 'T';
                        minVal = newFormat((exponentToNumber(this.data.min / 1000000000000)), precisionValue) + 'T';
                        targetVal = newFormat((exponentToNumber(this.data.target / 1000000000000)), precisionValue) + 'T';
                        for (var a = 0; a < this.data.toolTipInfo.length; a++) {
                            this.data.toolTipInfo[a].value = (newFormat((Number(this.data.toolTipInfo[a].value.replace(/\,/g, '')) / 1000000000000), precisionValue) + 'T').toString();
                        }
                        break;
                    }
            }
            switch (this.settings.trendDisplayUnits) {
                case 0:
                    {
                        trend1Val = newFormat(Math.abs(this.data.trendValue1), precisionValue_trend);
                        trend2Val = newFormat(Math.abs(this.data.trendValue2), precisionValue_trend);
                        break;
                    }
                case 1:
                    {
                        trend1Val = numberWithCommas(newFormat(Math.abs(this.data.trendValue1), precisionValue_trend));
                        trend2Val = numberWithCommas(newFormat(Math.abs(this.data.trendValue2), precisionValue_trend));
                        break;
                    }
                case 1000:
                    {
                        trend1Val = newFormat((Math.abs(this.data.trendValue1) / 1000), precisionValue_trend) + 'K';
                        trend2Val = newFormat((Math.abs(this.data.trendValue2) / 1000), precisionValue_trend) + 'K';
                        break;
                    }
                case 1000000:
                    {
                        trend1Val = newFormat((Math.abs(this.data.trendValue1) / 1000000), precisionValue_trend) + 'M';
                        trend2Val = newFormat((Math.abs(this.data.trendValue2) / 1000000), precisionValue_trend) + 'M';
                        break;
                    }
                case 1000000000:
                    {
                        trend1Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue1) / 1000000000)), precisionValue_trend) + 'bn';
                        trend2Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue2) / 1000000000)), precisionValue_trend) + 'bn';
                        break;
                    }
                case 1000000000000:
                    {
                        trend1Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue1) / 1000000000000)), precisionValue_trend) + 'T';
                        trend2Val = newFormat((exponentToNumber(Math.abs(this.data.trendValue2) / 1000000000000)), precisionValue_trend) + 'T';
                        break;
                    }
            }
            this.actual.text(this.data.actualFormat + actualVal); //Using values which are stored in data object
            this.percentage.text((percentageVal) + '%');
            this.min.text(this.data.minFormat + minVal);
            var upArrow = '&#8599;',
                arrowClassTV1, arrowClassTV2;
            var customwidth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var wifth = Number(customwidth) - 20;
            var percen = (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min));
            percen = (isNaN(percen)) ? 0 : percen;
            var passingValue = (((wifth * percen) / 100) <= 0) ? 0 : ((wifth * percen) / 100);
            var passingTextvalue = (wifth * (percen - 2)) / 100;
            //Scale on X-axis
            var actualFont = ((width + height) / 22);
            var percentageFont = actualFont / 2.5;
            var topMargin = (height / 7) + 'px';
            this.actual.style('font-size', actualFont + 'px');
            this.actual.style('color', this.settings.DataColor);
            this.actual.style('margin-right', percentageFont + 'px');
            this.percentage.style('font-size', percentageFont + 'px');
            this.percentage.style('padding-top', (percentageFont + 5) + 'px');
            this.percentage.style('color', this.settings.DataColor);
            var trendValue1Text, trendValue2Text;
            var indexQualStatVal1, indexQualStatVal2, flagQualStatVal1 = false,
                flagQualStatVal2 = false,
                lengthColumn = options.dataViews[0].metadata.columns.length;
            //Populating Trend Value 1 and Trend Value 2 data  
            if (!dataView.metadata || !dataView)
                return;
            for (var ite = 0; ite < lengthColumn; ite++) {
                if (dataView.metadata.columns[ite].roles['QualitativeState1Value'] === true) {
                    flagQualStatVal1 = true;
                    indexQualStatVal1 = ite;
                }
                if (dataView.metadata.columns[ite].roles['QualitativeState2Value'] === true) {
                    flagQualStatVal2 = true;
                    indexQualStatVal2 = ite;
                }
            }
            if (flagQualStatVal1) {
                trendValue1Text = dataView.metadata.columns[indexQualStatVal1].displayName;
            } else {
                trendValue1Text = '';
            }
            if (flagQualStatVal2) {
                trendValue2Text = dataView.metadata.columns[indexQualStatVal2].displayName;
            } else {
                trendValue2Text = '';
            }
            //Adding css dynamically to make the component responsive, all values are calculated from Viewport value
            this.heading.style('margin-top', topMargin);
            this.trendValue1.style('font-size', percentageFont + 'px');
            this.trendValue1.style('color', this.settings.trendColor);
            this.trendValue1.style('text-align', 'right');
            this.trendValue2.style('font-size', percentageFont + 'px');
            this.trendValue2.style('color', this.settings.trendColor);
            this.trendValue2.style('text-align', 'right');
            var scale = d3.scale.linear()
                .domain([0, Math.max(sortedRanges[0], this.data.target, this.data.value)])
                .range([0, width]);
            if (flagQualStatVal1) {
                this.trendValue1.style('display', 'inline');
                this.trendValue1.select('span.trendvalue1arrow').remove();
                this.trendValue1.select('span').remove();
                this.trendValue1.append('span')
                    .classed('trendvalue1arrow', true)
                    .html(upArrow);
                this.trendValue1.append('span').text(trend1Val + this.data.trend1Format + ' ' + trendValue1Text);
                if (this.data.trendValue1 < 0) {
                    //$('.trendvalue1arrow').css('Transform','rotate(90deg)');
                    if ((document.querySelectorAll(".trendvalue1arrow")).length != 0) {
                        arrowClassTV1 = document.querySelectorAll(".trendvalue1arrow");
                        arrowClassTV1[0].style.transform = "rotate(90deg)";
                        arrowClassTV1[0].style.display = "inline-block"
                    }
                }
            } else {
                this.trendValue1.style('display', 'none');
            }
            if (flagQualStatVal2) {
                this.trendValue2.style('display', 'inline');
                this.trendValue2.select('span.trendvalue2arrow').remove();
                this.trendValue2.select('span').remove();
                this.trendValue2.append('span')
                    .classed('trendvalue2arrow', true)
                    .html(upArrow);
                this.trendValue2.append('span').text(trend2Val + this.data.trend2Format + ' ' + trendValue2Text);
                if (this.data.trendValue2 < 0) {
                    if ((document.querySelectorAll(".trendvalue2arrow")).length != 0) {
                        arrowClassTV2 = document.querySelectorAll(".trendvalue2arrow");
                        arrowClassTV2[0].style.transform = "rotate(90deg)";
                        arrowClassTV2[0].style.display = "inline-block"
                    }
                }
            } else {
                this.trendValue2.style('display', 'none');
            }
            if ((document.querySelectorAll(".trendvalue1arrow")).length != 0) {
                arrowClassTV1 = document.querySelectorAll(".trendvalue1arrow");
                arrowClassTV1[0].style.fontSize = percentageFont + 4 + 'px';
            }
            if ((document.querySelectorAll(".trendvalue1arrow")).length != 0) {
                arrowClassTV2 = document.querySelectorAll(".trendvalue2arrow");
                arrowClassTV2[0].style.fontsize = percentageFont + 4 + 'px';
            }
            //Ranges
            var range = this.svgLinear.selectAll('rect.range')
                .data(sortedRanges);
            range.enter()
                .append('rect')
                .attr('class', function (d, i) {
                    return 'range s' + i;
                });
            range
                .attr('x', 0)
                .attr('width', function (d) {
                    return (Math.abs(scale(d) - scale(0)));
                })
                .attr('height', modHeight)
                .style('fill', this.settings.ComparisonFillColor);
            //Comparison measure
            this.svgLinear.selectAll('rect.measure').remove();
            if (this.data.comparison > 0) {
                var comparison = this.svgLinear
                    .append('rect')
                    .classed('measure', true)
                    .style('fill', this.settings.ComparisonFillColor);
                comparison
                    .attr('width', scale(this.data.comparison))
                    .attr('height', (modHeight / 3))
                    .attr('x', 0)
                    .attr('y', (modHeight / 3));
            }
            var percent = (((this.data.actual - this.data.min) * 100) / (this.data.max - this.data.min));
            percent = (isNaN(percent)) ? 0 : percent;
            var actual = (((width * percent) / 100) <= 0) ? 0 : ((width * percent) / 100);
            actual = (isNaN(actual)) ? 0 : actual;
            //Main measure
            var measure = this.svgLinear
                .append('rect')
                .classed('measure', true)
                .style('fill', this.settings.ActualFillColor);
            if (this.data.actual < this.data.max) {
                measure
                    .attr('width', actual)
                    .attr('height', modHeight)
                    .attr('x', 0)
                    .attr('y', 0);
            } else {
                measure
                    .attr('width', width)
                    .attr('height', modHeight)
                    .attr('x', 0)
                    .attr('y', 0);
            }
            if (this.data.max <= this.data.min) {
                measure.style('display', 'none');
            }
            //Target markers
            this.svgLinear.selectAll('line.marker').remove();
            var marker = this.svgLinear
                .append('line')
                .classed('marker', true)
                .style('stroke', 'black');
            var startingPoint = 0;
            var minvalueWidth = 0,
                tiltend;
            var customMin = (window.getComputedStyle($(this.min[0][0])[0]).width).slice(0, -2);
            startingPoint = Number(customMin) + 10;
            globalminLength = startingPoint;
            var customsvgWidth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var fullsvgWidth = Number(customsvgWidth) - 20;
            minvalueWidth = (fullsvgWidth * (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min))) / 100;
            globalTargetWidth = minvalueWidth;
            var targetValueText = this.data.targetFormat + targetVal
            var targetTextwidth = 9 * targetValueText.length + 10;
            var flag = false;
            if (globalTargetWidth < globalminLength || passingValue < (targetTextwidth + startingPoint)) {
                tiltend = globalminLength + 10;
                flag = true;
            } else {
                tiltend = passingValue;
                flag = false;
            }
            marker
                .attr({
                    x1: passingValue,
                    y1: 0,
                    x2: passingValue,
                    y2: modHeight
                });
            this.svgLinear.selectAll('line.markerTilt').remove();
            var tiltmarker = this.svgLinear
                .append('line')
                .classed('markerTilt', true)
                .style('stroke', 'black');
            tiltmarker
                .attr({
                    x1: passingValue,
                    y1: modHeight,
                    x2: (tiltend),
                    y2: (modHeight + 10)
                });
            if (globalTargetWidth > globalminLength) {
                this.svgLinear.selectAll('line.markerTilt').remove();
            }
            //Target Text   
            
            var customwifth = (window.getComputedStyle($(this.svg[0][0])[0]).width).slice(0, -2);
            var wifth = Number(customwifth) - 10;
            var percen = (((this.data.target - this.data.min) * 100) / (this.data.max - this.data.min));
            percen = (isNaN(percen)) ? 0 : percen;
            var passingValue = (((wifth * percen) / 100) <= 0) ? 0 : ((wifth * percen) / 100);
            var diff = wifth - passingValue + 20;
            if (flag == false) {
                this.targetText.selectAll('span.markerTarget').remove();
                this.svgLinear.selectAll('text.markerTarget').remove();
                if (diff >= 20) {
                    var markerText = this.targetText
                        .append('span')
                        .classed('markerTarget', true)
                        .text(this.data.targetFormat + targetVal)
                        .style("float", "right")
                        .style('color', 'Black')
                        .style("margin-right", diff + 'px');
                } else {
                    var markerText = this.targetText
                        .append('span')
                        .classed('markerTarget', true)
                        .text(this.data.targetFormat + targetVal)
                        .style("float", "right")
                        .style('color', 'Black')
                        //.style("margin-right",diff+'px')
                        .style("display", 'none');
                }
            } else {
                this.targetText.selectAll('span.markerTarget').remove();
                this.svgLinear.selectAll('text.markerTarget').remove();
                var markerText = this.svgLinear
                    .append('text')
                    .classed('markerTarget', true)
                    .style('color', 'black')
                    .style('text-anchor', 'start')
                    .text(this.data.targetFormat + targetVal)
                markerText
                    .attr('width', 1)
                    .attr('height', modHeight)
                    .attr('x', tiltend)
                    .attr('y', (modHeight + 20))
                    .attr('overflow', 'visible !important');
                this.targetText.style("Display", "None");
            }
            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            if (this.data.target < this.data.min || !(this.data.targetSet)) {
                this.svgLinear.selectAll('text.markerTarget').remove();
                this.svgLinear.selectAll('line.marker').remove();
                this.svgLinear.selectAll('line.markerTilt').remove();
            }
            if (this.data.target > this.data.max) {
                //this.svgLinear.selectAll('.measure').style('display','none');
                this.svgLinear.selectAll('.marker').style('display', 'none');
                this.targetText.style('display', 'none');
                this.svgLinear.selectAll('line.marker').remove();
                this.svgLinear.selectAll('line.markerTilt').remove();
                this.svgLinear.selectAll('text.markerTarget').remove();
            } else {
                //this.svgLinear.selectAll('.measure').style('display','block');
                this.svgLinear.selectAll('.marker').style('display', 'block');
                this.targetText.style('display', 'block');
            }
            if (dataView.metadata.columns[1] == undefined) {
                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('data_tab'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getTwoTooltipData(dataView.metadata.columns[0].displayName, actualVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);

                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('rect.measure'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getTwoTooltipData(dataView.metadata.columns[0].displayName, actualVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);

                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('rect.range'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getTwoTooltipData(dataView.metadata.columns[0].displayName, actualVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);

            } else {
                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('data_tab'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getOneTooltipData(dataView.metadata.columns[0].displayName, actualVal, dataView.metadata.columns[1].displayName, targetVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);

                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('rect.measure'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getOneTooltipData(dataView.metadata.columns[0].displayName, actualVal, dataView.metadata.columns[1].displayName, targetVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);

                this.tooltipServiceWrapper.addTooltip(this.svgLinear.selectAll('rect.range'),
                    (tooltipEvent: TooltipEventArgs<number>) => LinearGauge.getOneTooltipData(dataView.metadata.columns[0].displayName, actualVal, dataView.metadata.columns[1].displayName, targetVal),
                    (tooltipEvent: TooltipEventArgs<number>) => null);
            }
            globalminValue = minVal;
            globalTargetValue = targetVal;
        }
        //Make visual properties available in the property pane in Power BI
        //values which we can customized from property pane in Power BI 
        public getSettings(objects: DataViewObjects): boolean {
            var settingsChanged = false;
            if (typeof this.settings == 'undefined' || (JSON.stringify(objects) !== JSON.stringify(this.prevDataViewObjects))) {
                this.settings = {
                    ComparisonFillColor: getValue<Fill>(objects, 'general', 'ComparisonFillColor', {
                        solid: {
                            color: "lightgrey"
                        }
                    }).solid.color, // The color of the outer circle.
                    ActualFillColor: getValue<Fill>(objects, 'general', 'ActualFillColor', {
                        solid: {
                            color: "orange"
                        }
                    }).solid.color, // The color of the fill wave.
                    DataColor: getValue<Fill>(objects, 'labels', 'DataColor', {
                        solid: {
                            color: "black"
                        }
                    }).solid.color, // The color of the outer circle.
                    labelDisplayUnits: getValue<number>(objects, 'labels', 'labelDisplayUnits', 0),
                    markerWidth: getValue<number>(objects, 'labels', 'markerWidth', 0),
                    trendColor: getValue<Fill>(objects, 'trendLabels', 'trendColor', {
                        solid: {
                            color: "black"
                        }
                    }).solid.color, // The color of the outer circle.
                    trendDisplayUnits: getValue<number>(objects, 'trendLabels', 'trendDisplayUnits', 0),
                    lineWidth: getValue<number>(objects, 'trendLabels', 'lineWidth', 0)
                };
                settingsChanged = true;
            }
            this.prevDataViewObjects = objects;
            return settingsChanged;
        }
        private static getOneTooltipData(value: any, tab: any, avalue: any, atab: any): VisualTooltipDataItem[] {
            return [{
                displayName: value,
                value: tab
            }, {
                displayName: avalue,
                value: atab
            }];
        }
        private static getTwoTooltipData(value: any, tab: any): VisualTooltipDataItem[] {
            return [{
                displayName: value,
                value: tab
            }];
        }
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            var objectEnumeration: VisualObjectInstance[] = [];
            if (!this.data) {
                this.data = LinearGauge.getDefaultData();
            }
            if (!this.cardFormatSetting)
                this.cardFormatSetting = this.getDefaultFormatSettings();
            if (!this.cardFormatSetting_trend)
                this.cardFormatSetting_trend = this.getDefaultFormatSettings_trend();
            var formatSettings = this.cardFormatSetting;
            var formatSettings_trend = this.cardFormatSetting_trend;
            switch (options.objectName) {
                case 'general':
                    objectEnumeration.push({
                        objectName: 'general',
                        displayName: 'General',
                        selector: null,
                        properties: {
                            ActualFillColor: {
                                solid: {
                                    color: this.settings.ActualFillColor
                                }
                            },
                            ComparisonFillColor: {
                                solid: {
                                    color: this.settings.ComparisonFillColor
                                }
                            }
                        }
                    });
                    break;
                case 'labels':
                    objectEnumeration.push({
                        objectName: 'labels',
                        displayName: 'Labels',
                        selector: null,
                        properties: {
                            DataColor: {
                                solid: {
                                    color: this.settings.DataColor
                                }
                            },
                            labelDisplayUnits: this.settings.labelDisplayUnits,
                            markerWidth: this.settings.markerWidth
                        }
                    });
                    break;
                case 'trendLabels':
                    objectEnumeration.push({
                        objectName: 'trendLabels',
                        displayName: 'Labels',
                        selector: null,
                        properties: {
                            trendColor: {
                                solid: {
                                    color: this.settings.trendColor
                                }
                            },
                            trendDisplayUnits: this.settings.trendDisplayUnits,
                            lineWidth: this.settings.lineWidth
                        }
                    });
                    break;
            }
            return objectEnumeration;
        }
    }
}