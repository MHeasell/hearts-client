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

        describe('getPassDirection function', function() {
            it('returns "left" for round 1', function() {
                expect(util.getPassDirection(1)).toBe("left");
            });
            it('returns "right" for round 2', function() {
                expect(util.getPassDirection(2)).toBe("right");
            });
            it('returns "across" for round 3', function() {
                expect(util.getPassDirection(3)).toBe("across");
            });
            it('returns "none" for round 4', function() {
                expect(util.getPassDirection(4)).toBe("none");
            });
            it('works for rounds greater than 4', function() {
                expect(util.getPassDirection(5)).toBe("left");
                expect(util.getPassDirection(6)).toBe("right");
                expect(util.getPassDirection(7)).toBe("across");
                expect(util.getPassDirection(8)).toBe("none");
            });
        });

        describe('compareCards function', function() {
            describe('for cards of the same suit', function() {
                it('returns less than 0 when a is lower rank than b', function() {
                    expect(util.compareCards("c2", "c3")).toBeLessThan(0);
                    expect(util.compareCards("c5", "c8")).toBeLessThan(0);

                    expect(util.compareCards("s9", "s10")).toBeLessThan(0);
                    expect(util.compareCards("d4", "d7")).toBeLessThan(0);
                });

                it('returns 0 when the cards are the same rank', function() {
                    expect(util.compareCards("c6", "c6")).toBe(0);
                    expect(util.compareCards("s4", "s4")).toBe(0);
                    expect(util.compareCards("h8", "h8")).toBe(0);
                });

                it('returns greater than 0 when a is higher rank than b', function() {
                    expect(util.compareCards("c9", "c8")).toBeGreaterThan(0);
                    expect(util.compareCards("s10", "s9")).toBeGreaterThan(0);
                    expect(util.compareCards("d3", "d2")).toBeGreaterThan(0);
                    expect(util.compareCards("h6", "h3")).toBeGreaterThan(0);
                });

                it('works for face cards', function() {
                    expect(util.compareCards("cj", "cq")).toBeLessThan(0);
                    expect(util.compareCards("cq", "ck")).toBeLessThan(0);
                    expect(util.compareCards("cj", "ck")).toBeLessThan(0);

                    expect(util.compareCards("cj", "cj")).toBe(0);
                    expect(util.compareCards("cq", "cq")).toBe(0);
                    expect(util.compareCards("ck", "ck")).toBe(0);

                    expect(util.compareCards("cq", "cj")).toBeGreaterThan(0);
                    expect(util.compareCards("ck", "cq")).toBeGreaterThan(0);
                    expect(util.compareCards("ck", "cj")).toBeGreaterThan(0);
                });

                it('considers aces to be high', function() {
                    expect(util.compareCards("ck", "c1")).toBeLessThan(0);

                    expect(util.compareCards("c1", "ck")).toBeGreaterThan(0);

                    expect(util.compareCards("c1", "c2")).toBeGreaterThan(0);
                    expect(util.compareCards("c2", "c1")).toBeLessThan(0);
                });
            });

            describe('for cards of different suits', function() {
                it('considers diamonds greater than clubs', function() {
                    expect(util.compareCards("c7", "d5")).toBeLessThan(0);
                    expect(util.compareCards("d8", "c8")).toBeGreaterThan(0);
                });

                it('considers spades to be greater than diamonds', function() {
                    expect(util.compareCards("dq", "s2")).toBeLessThan(0);
                    expect(util.compareCards("s5", "d5")).toBeGreaterThan(0);
                });

                it('considers hearts to be greater than spades', function() {
                    expect(util.compareCards("s6", "h3")).toBeLessThan(0);
                    expect(util.compareCards("h7", "s7")).toBeGreaterThan(0);
                });

                it('has transitivity', function() {
                    expect(util.compareCards("ck", "h3")).toBeLessThan(0);
                    expect(util.compareCards("h5", "d7")).toBeGreaterThan(0);
                });
            });
        });
    });
});
