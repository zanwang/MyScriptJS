(function (scope) {

    /**
     * Represent the Analyzer Renderer. It's use to calculate the analyzer ink rendering in HTML5 canvas
     *
     * @class AnalyzerRenderer
     * @constructor
     */
    function AnalyzerRenderer () {
    }

    /**
     * Inheritance property
     */
    AnalyzerRenderer.prototype = new scope.AbstractRenderer();

    /**
     * Constructor property
     */
    AnalyzerRenderer.prototype.constructor = AnalyzerRenderer;

    /**
     * Draw text on analyser
     *
     * @method drawText
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     * @param {Object} text
     * @param {Object} justificationType
     * @param {Object} textHeight
     * @param {Object} baseline
     * @param {Object} parameters
     * @param {Object} context
     * @returns {{x: *, y: *}}
     */
    AnalyzerRenderer.prototype.drawText = function (x, y, width, height, text, justificationType, textHeight, baseline, parameters, context) {

        var topLeft = {
                x: x,
                y: y
            },
            textMetrics;

        // If Text height is taller than Bounding box height
        if (textHeight > height) {
            textHeight = height;
        }

        context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;

        textMetrics = context.measureText(text);

        // If Text width is wider than Bounding box width
        if (textMetrics.width > width) {
            textHeight = textHeight * width / textMetrics.width;
            context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;
        } else {
            // If Text is analyzed as centered
            if ('CENTER' === justificationType) {
                topLeft.x = x + (width - textMetrics.width) / 2;
            }
        }

        context.save();
        try {
            context.fillStyle = parameters.getColor();
            context.strokeStyle = parameters.getColor();
            context.globalAlpha = parameters.getAlpha();
            context.lineWidth = 0.5 * parameters.getWidth();

            context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;

            context.fillText(text, topLeft.x, baseline);

        } finally {
            context.restore();
        }
        return topLeft;
    };

    /**
     * Draw table
     *
     * @method tableStrokesDrawing
     * @param {Object} strokes
     * @param {Object} parameters
     * @param {Object} tables
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.tableStrokesDrawing = function (strokes, parameters, tables, context) {
        for (var i in tables) {
            if (tables[i].data) {

                if (this.showBoundingBoxes) {
                    for (var j in tables[i].getCells()) {
                        this.drawCell(tables[i].getCells()[j], parameters, context);
                    }
                }
                for (var z in tables[i].getLines()) {
                    this.drawLine(tables[i].getLines()[z], parameters, context);
                }
            }
        }
    };

    /**
     * Draw the text line
     *
     * @method textLineStrokesDrawing
     * @param {Object} strokes
     * @param {Object} parameters
     * @param {Object} textLines
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.textLineStrokesDrawing = function (strokes, parameters, textLines, context) {

        for (var i in textLines) {
            var textLine = textLines[i];
            var data = textLine.getData();
            if (data) {

                if (this.showBoundingBoxes) {
                    this.drawRectangle(data.getTopLeftPoint().x, data.getTopLeftPoint().y, data.getWidth(), data.getHeight(), parameters, context);
                }

                var selectedCandidateidx = textLine.result.textSegmentResult.selectedCandidateIdx;
                var text = textLine.result.textSegmentResult.candidates[selectedCandidateidx].label;
                var textHeight = data.getTextHeight();

                var topLeft = this.drawText(data.getTopLeftPoint().getX(), data.getTopLeftPoint().getY(), data.getWidth(), data.getHeight(), text, data.getJustificationType(), data.getTextHeight(), data.getBaselinePos(), parameters, context);

                var lowerBaselinePos = data.getBaselinePos() + textHeight / 10;

                var underlines = textLine.getUnderlineList();

                for (var j in underlines) {
                    var firstCharacter = underlines[j].getData().getFirstCharacter();
                    var lastCharacter = underlines[j].getData().getLastCharacter();

                    var textMetrics = context.measureText(text);

                    textMetrics = context.measureText(text.substring(0, firstCharacter));
                    var x1 = topLeft.x + textMetrics.width;

                    textMetrics = context.measureText(text.substring(firstCharacter, lastCharacter + 1));
                    var x2 = x1 + textMetrics.width;
                    this.drawLine({
                        x: x1,
                        y: lowerBaselinePos
                    }, {
                        x: x2,
                        y: lowerBaselinePos
                    }, parameters, context);
                }
            }
        }
    };

    /**
     * Draw a line
     *
     * @method drawLine
     * @param {Object} line
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawLine = function (line, parameters, context) {
        if (line.data === null) {
            this.drawLineByPoints(line.getData().getP1(), line.getData().getP2(), parameters, context);
        }
    };

    /**
     * Draw a cell
     *
     * @method drawCell
     * @param {Object} cell
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawCell = function (cell, parameters, context) {
        if (cell.data === null) {
            this.drawRectangle(cell.getData().getTopLeftPoint().getX(), cell.getData().getTopLeftPoint().getY(), cell.getData().getWidth(), cell.getData().getHeight(), parameters, context);
        }
    };

    /**
     * Draw shape strokes on HTML5 canvas
     *
     * @method drawStrokesByRecognitionResult
     * @param {Object} strokes
     * @param {Object} recognizedParameters
     * @param {Object} notRecognizedParameters
     * @param {Object} segments
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawStrokesByRecognitionResult = function (strokes, recognitionResult, parameters, context) {

        var segments = recognitionResult.getShapes();

        for (var i in segments) {
            var segment = segments[i],
                candidate = segment.getSelectedCandidate(),
                extractedStrokes;

            if (candidate) {
                if (candidate.isRecognized()) {
                    this.drawRecognizedShape(candidate, parameters, context);
                } else if (candidate.isNotRecognized()) {

                    var inkRanges = segment.getInkRanges();
                    for (var j in inkRanges) {

                        extractedStrokes = this.extractStroke(strokes, inkRanges[j]);

                        for (var k in extractedStrokes) {
                            this.drawStroke(extractedStrokes[k], parameters, context);
                        }
                    }
                }
            }
        }
    };

    /**
     * Get Strokes from inkRange
     *
     * @method extractStroke
     * @param {Object} strokes
     * @param {Object} inkRange
     * @result {Array} List of strokes from inkRange
     */
    AnalyzerRenderer.prototype.extractStroke = function (strokes, inkRange) {
        var result = [],
            firstPointIndex = Math.floor(inkRange.getFirstPoint()),
            lastPointIndex = Math.ceil(inkRange.getLastPoint());

        for (var strokeIndex = inkRange.getFirstStroke(); strokeIndex <= inkRange.getLastStroke(); strokeIndex++) {
            var currentStroke = strokes[strokeIndex];
            var currentStrokePointCount = currentStroke.x.length;

            var newStroke = [];

            for (var pointIndex = firstPointIndex; (strokeIndex === inkRange.getLastStroke() && pointIndex <= lastPointIndex && pointIndex < currentStrokePointCount) || (strokeIndex !== inkRange.getLastStroke() && pointIndex < currentStrokePointCount); pointIndex++) {
                newStroke.push({
                    x: currentStroke.x[pointIndex],
                    y: currentStroke.y[pointIndex],
                    pressure: 0.5,
                    distance: 0.0,
                    length: 0.0,
                    ux: 0.0,
                    uy: 0.0,
                    x1: 0.0,
                    x2: 0.0,
                    y1: 0.0,
                    y2: 0.0
                });
            }

            result.push(newStroke);
        }
        return result;
    };

    /**
     * This method allow you to draw recognized shape
     *
     * @method drawRecognizedShape
     * @param {Object} shapeRecognized
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawRecognizedShape = function (shapeRecognized, parameters, context) {

        var primitives = shapeRecognized.getPrimitives();

        for (var i in primitives) {
            this.drawShapePrimitive(primitives[i], parameters, context);
        }
        if (this.showBoundingBoxes) {
            var rectangleList = [];

            for (var j in primitives) {
                // Primitive bounding rect
                rectangleList.push(this.getPrimitiveBoundingBox(primitives[j]));
            }
            // Bounding rect of the entire shape
            var boundingRect = scope.MathUtils.getBoundingRect(rectangleList);
            this.drawRectangle(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height, parameters, context);
        }
    };

    /**
     * Draw shape primitive
     *
     * @method drawShapePrimitive
     * @param {Object} primitive
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapePrimitive = function (primitive, parameters, context) {
        if (primitive.isEllipse()) {
            this.drawShapeEllipse(primitive, parameters, context);
        } else if (primitive.isLine()) {
            this.drawShapeLine(primitive, parameters, context);
        }
    };

    /**
     * Draw shape ellipse
     *
     * @method drawShapeEllipse
     * @param {Object} shapeEllipse
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeEllipse = function (shapeEllipse, parameters, context) {

        var points = this.drawEllipseArc(
            shapeEllipse.getCenter(),
            shapeEllipse.getMaxRadius(),
            shapeEllipse.getMinRadius(),
            shapeEllipse.getOrientation(),
            shapeEllipse.getStartAngle(),
            shapeEllipse.getSweepAngle(),
            parameters, context);

        if (shapeEllipse.hasBeginDecoration() && shapeEllipse.getBeginDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(points[0], shapeEllipse.getBeginTangentAngle(), 12.0, parameters, context);
        }

        if (shapeEllipse.hasEndDecoration() && shapeEllipse.getEndDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(points[1], shapeEllipse.getEndTangentAngle(), 12.0, parameters, context);
        }
    };

    /**
     * Draw shape line
     *
     * @method drawShapeLine
     * @param {Object} shapeLine
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeLine = function (shapeLine, parameters, context) {

        this.drawLineByPoints(shapeLine.getFirstPoint(), shapeLine.getLastPoint(), parameters, context);

        if (shapeLine.hasBeginDecoration() && shapeLine.getBeginDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(shapeLine.getFirstPoint(), shapeLine.getBeginTangentAngle(), 12.0, parameters, context);
        }

        if (shapeLine.hasEndDecoration() && shapeLine.getEndDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(shapeLine.getLastPoint(), shapeLine.getEndTangentAngle(), 12.0, parameters, context);
        }
    };

    /**
     * Draw an arrow head on context
     *
     * @method drawArrowHead
     * @param {Object} headPoint
     * @param {Object} angle
     * @param {Object} length
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawArrowHead = function (headPoint, angle, length, parameters, context) {

        var alpha = this.Phi(angle + Math.PI - (Math.PI / 8)),
            beta = this.Phi(angle - Math.PI + (Math.PI / 8));

        context.save();
        try {
            context.fillStyle = parameters.getColor();
            context.strokeStyle = parameters.getColor();
            context.globalAlpha = parameters.getAlpha();
            context.lineWidth = 0.5 * parameters.getWidth();

            context.moveTo(headPoint.x, headPoint.y);
            context.beginPath();
            context.lineTo(headPoint.x + (length * Math.cos(alpha)), headPoint.y + (length * Math.sin(alpha)));
            context.lineTo(headPoint.x + (length * Math.cos(beta)), headPoint.y + (length * Math.sin(beta)));
            context.lineTo(headPoint.x, headPoint.y);
            context.fill();

        } finally {
            context.restore();
        }

    };

    /**
     * Draw an ellipse arc on context
     *
     * @method drawEllipseArc
     * @param {Object} centerPoint
     * @param {Object} maxRadius
     * @param {Object} minRadius
     * @param {Object} orientation
     * @param {Object} startAngle
     * @param {Object} sweepAngle
     * @param {Object} parameters
     * @param {Object} context
     * @returns {Array}
     */
    AnalyzerRenderer.prototype.drawEllipseArc = function (centerPoint, maxRadius, minRadius, orientation, startAngle, sweepAngle, parameters, context) {

        var angleStep = 0.02; // angle delta between interpolated

        var z1 = Math.cos(orientation);
        var z3 = Math.sin(orientation);
        var z2 = z1;
        var z4 = z3;
        z1 *= maxRadius;
        z2 *= minRadius;
        z3 *= maxRadius;
        z4 *= minRadius;

        var n = Math.floor(Math.abs(sweepAngle) / angleStep);

        var boundariesPoints = [];

        context.save();
        try {
            context.fillStyle = parameters.getColor();
            context.strokeStyle = parameters.getColor();
            context.globalAlpha = parameters.getAlpha();
            context.lineWidth = 0.5 * parameters.getWidth();

            context.beginPath();

            for (var i = 0; i <= n; i++) {

                var angle = startAngle + (i / n) * sweepAngle; // points on the arc, in radian
                var alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius);

                var cosAlpha = Math.cos(alpha);
                var sinAlpha = Math.sin(alpha);

                // current point
                var x = centerPoint.x + z1 * cosAlpha - z4 * sinAlpha;
                var y = centerPoint.y + z2 * sinAlpha + z3 * cosAlpha;
                if (i === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }

                if (i === 0 || i === n) {
                    boundariesPoints.push({x: x, y: y});
                }
            }

            context.stroke();

        } finally {
            context.restore();
        }

        return boundariesPoints;
    };



    // Export
    scope.AnalyzerRenderer = AnalyzerRenderer;
})(MyScript);