define(['heartsUtil'], function(util) {

    describe('heartsUtil module', function() {

        describe('containsSuit function', function() {

            it('is false for empty lists', function() {
                expect(util.containsSuit([], 'h')).toBe(false);
            });

            it('is true when a card of the given suit is present', function() {
                var cards = ["h4", "c5", "s6"];
                expect(util.containsSuit(cards, "c")).toBe(true);
            });

            it('is false when the suit is not present', function() {
                var cards = ["h4", "c5", "s6"];
                expect(util.containsSuit(cards, "d")).toBe(false);
            });
        });

        describe('sumPoints function', function() {
            it('returns zero for empty lists', function() {
                expect(util.sumPoints([])).toBe(0);
            });

            it('counts hearts as one point each', function() {
                expect(util.sumPoints(["h8", "hk"])).toBe(2);
                expect(util.sumPoints(["h3", "h5", "h10"])).toBe(3);
                expect(util.sumPoints(["c7", "h2", "s8"])).toBe(1);
            });

            it('counts the queen of spades as 13 points', function() {
                expect(util.sumPoints(["sq"])).toBe(13);
                expect(util.sumPoints(["h2", "s4", "sq", "h10"])).toBe(15);
            });

            it('counts all other cards as zero', function() {
                expect(util.sumPoints(["c4", "d8", "s6", "d9"])).toBe(0);
            });
        });

        describe('getSingularSuitName function', function() {
            it('returns "club" for c', function() {
                expect(util.getSingularSuitName("c")).toBe("club");
            });

            it('returns "spade" for s', function() {
                expect(util.getSingularSuitName("s")).toBe("spade");
            });

            it('returns "diamond" for c', function() {
                expect(util.getSingularSuitName("d")).toBe("diamond");
            });

            it('returns "heart" for h', function() {
                expect(util.getSingularSuitName("h")).toBe("heart");
            });

            it('throws an error for other letters', function() {
                expect(function() { util.getSingularSuitName("u"); }).toThrow();
                expect(function() { util.getSingularSuitName("z"); }).toThrow();
                expect(function() { util.getSingularSuitName("a"); }).toThrow();
            });
        });

        describe('findWinningIndex function', function() {
            describe('when the cards are of the same suit', function() {
                it('returns the index of the highest card', function() {
                    var cardsA = ["c5", "c6", "c3", "c4"];
                    expect(util.findWinningIndex(cardsA)).toBe(1);

                    var cardsB = ["h4", "h6", "h2", "h10"];
                    expect(util.findWinningIndex(cardsB)).toBe(3);
                });

                it('works for face cards', function() {
                    expect(util.findWinningIndex(['s3', 'sj', 's10'])).toBe(1);
                    expect(util.findWinningIndex(['sj', 's10', 'sq'])).toBe(2);
                    expect(util.findWinningIndex(['sk', 'sj', 'sq'])).toBe(0);
                });

                it('considers aces to be high', function() {
                    expect(util.findWinningIndex(['s4', 's1', 's8'])).toBe(1);
                    expect(util.findWinningIndex(['d1', 'd3', 'd6'])).toBe(0);
                    expect(util.findWinningIndex(['dk', 'dq', 'dj', 'd1'])).toBe(3);
                });
            });

            describe('when the cards are of different suits', function() {
                it('only considers cards in the leading suit', function() {
                    expect(util.findWinningIndex(['c6', 's9', 'c8', 'h10'])).toBe(2);
                    expect(util.findWinningIndex(['h2', 'd9', 'cj', 'sk'])).toBe(0);
                });
            });
        });

        describe('parseCard function', function() {
            it('splits cards into suit and rank', function() {
                expect(util.parseCard('c2')).toEqual({ suit: 'c', rank: '2' });
                expect(util.parseCard('h10')).toEqual({ suit: 'h', rank: '10' });
                expect(util.parseCard('d1')).toEqual({ suit: 'd', rank: '1' });
                expect(util.parseCard('sq')).toEqual({ suit: 's', rank: 'q' });
                expect(util.parseCard('cj')).toEqual({ suit: 'c', rank: 'j' });
            });
        });
    });
});
