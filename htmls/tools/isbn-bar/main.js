var AppBarCode = angular.module('AppBarCode', []);

/*
<ul class="pagination">
  <li class="disabled"><a href="#">&laquo;</a></li>
  <li class="active"><a href="#">1 <span class="sr-only">(current)</span></a></li>
  ...
</ul>
*/

AppBarCode.
directive('bookpag', function($parse) {
    return {
        template: '<ul class="pagination pagination-sm">' +
                    '<li ng-class="{disabled:page.page==1}"><a href="" ng-click="page.page=1">&laquo;</a></li>' +
                    '<li ng-class="{active: page.page == ($index + 1)}" ng-repeat="p in page.pages track by $index"><a href="" ng-click="page.page = ($index + 1)">{{ $index + 1 }}</a></li>' +
                    '<li ng-class="{disabled:page.page==page.total}"><a href="" ng-click="page.page=page.total">&raquo;</a></li>' +
                '</ul>',

        link: function(scope, element, attrs) {
            scope.page = scope.pageobj;
        }
    };
});


function fixIsbn(isbn) {
    if (! isbn) {
        return null;
    }

    var m = isbn.match(/^\s*(978-)?([\d\-]+[\dxX])/);
    if (! m) {
        return null;
    }

    return '978-' + m[2];
}

AppBarCode.controller('CustIsbnCtrl', function($scope, $timeout) {
    $scope.isbn = $scope.defaultISBN = '978-7-122-18010-0';

    $scope.$watch('isbn', function(isbn) {
        isbn = fixIsbn(isbn);

        if (! isbn) {
            $scope.imgdata = null;
            return;
        }

        $scope.imgdata = makeBarCodeImage(isbn);
    });
});

AppBarCode.directive('isbnBar', function($parse, $timeout) {
    return {
        template: '<span ng-if="!isbn">不认识这码</span>' +
            '<span ng-show="isbn"><img ng-if="isbn && imgdata" ng-src="{{ imgdata }}" width="100"></span>',

        link: function(scope, element, attrs) {
            var isbn = fixIsbn($parse(attrs.isbnBar)(scope));

            if (! isbn) {
                return;
            }

            scope.isbn = isbn;
            var cc = $timeout(function() {
                // scope.imgdata = makeBarCodeImage(isbn);
            }, 0);
            scope.$on('$destroy', function() {
                $timeout.cancel(cc);
            });
        }
    };
});

// Encapsulate the bitmap interface
function Bitmap() {
    var clr  = [0, 0, 0];
    var pts  = [];
    var minx = Infinity;    // min-x
    var miny = Infinity;    // min-y
    var maxx = 0;           // max-x
    var maxy = 0;           // max-y

    this.color = function(r, g, b) {
        clr = [r, g, b];
    }

    this.set = function(x,y) {
        x = Math.floor(x);
        y = Math.floor(y);
        pts.push([ x,y,clr ]);
        if (minx > x) minx = x;
        if (miny > y) miny = y;
        if (maxx < x) maxx = x;
        if (maxy < y) maxy = y;
    }

    this.makeImageData = function(scl, isbn, cvs, rot) {
        var cvs = cvs || document.createElement('canvas');

        if (pts.length == 0) {
            cvs.width  = 32;
            cvs.height = 32;
            cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height);
            cvs.style.visibility = 'visible';
            return;
        }

        if (rot == 'R' || rot == 'L') {
            var h = maxx-minx+1;
            var w = maxy-miny+1;
        } else {
            var w = maxx-minx+1;
            var h = maxy-miny+1;
        }

        cvs.width  = w;
        cvs.height = h;

        var ctx = cvs.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = '#000';

        var id  = ctx.getImageData(0, 0, cvs.width, cvs.height);
        var dat = id.data;

        for (var i = 0; i < pts.length; i++) {
            // PostScript builds bottom-up, we build top-down.
            var x = pts[i][0] - minx;
            var y = pts[i][1] - miny;
            var c = pts[i][2];

            if (rot == 'N') {
                y = h - y - 1;  // Invert y
            } else if (rot == 'I') {
                x = w - x - 1;  // Invert x
            } else {
                y = w - y;  // Invert y
                if (rot == 'L') {
                    var t = y;
                    y = h - x - 1;
                    x = t - 1;
                } else {
                    var t = x;
                    x = w - y;
                    y = t;
                }
            }

            var idx = (y * id.width + x) * 4
            dat[idx++] = c[0];  // r
            dat[idx++] = c[1];  // g
            dat[idx++] = c[2];  // b
            dat[idx]   = 255;
        }

        var txtHeight = 15 * scl;
        cvs.height += txtHeight;

        ctx.putImageData(id, 0, txtHeight);

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cvs.width, txtHeight);
        ctx.fillStyle = '#000';

        ctx.font = (10 * scl) + "px Arial";
        ctx.fillText('ISBN ' + isbn, 1, 12 * scl);

        return {
            data: cvs.toDataURL(),
            w: cvs.width,
            h: cvs.height
        };
    }
}

function makeBarCodeImage(isbn, cvs) {
    var bw = new BWIPJS;

    var opts = { includetext: bw.value(true), guardwhitespace: bw.value(true) };
    opts.inkspread = bw.value(0);

    bw.bitmap(new Bitmap);

    var scl = 2 * 3;
    bw.scale(scl,scl);

    bw.push(isbn);
    bw.push(opts);

    bw.call('isbn');

    var data = bw.bitmap().makeImageData(scl, isbn, cvs && cvs[0], 'N');
    console.log(scl, data.w, data.h);

    return data.data;
}

function render() {
}
