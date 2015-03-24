import subprocess
import os
import sys

file_list = ["card"+s+str(r)+".png"
        for s in ["Clubs", "Diamonds", "Spades", "Hearts"]
        for r in range(2,11) + ["J", "Q", "K", "A"]]

def num_rank(rank):
    if rank == "1":
        return 12
    if rank == "a":
        return 12
    if rank == "k":
        return 11
    if rank == "q":
        return 10
    if rank == "j":
        return 9
    return int(rank) - 2

def num_suit(suit):
    return ["c", "d", "s", "h"].index(suit)

if sys.argv[1] == "montage":
    arglist = ["montage.exe"]
    arglist.extend(file_list)
    arglist.append("-geometry")
    arglist.append("+0+0")
    arglist.append("-tile")
    arglist.append("13x4")
    arglist.append("-depth")
    arglist.append("8")
    arglist.append("-background")
    arglist.append("Transparent")
    arglist.append("montage.png")

    subprocess.call(arglist)

elif sys.argv[1] == "css":
    for s in ["c", "d", "s", "h"]:
        for r in map(str, range(1,11)) + ["j", "q", "k"]:
            offset_x = -70 * num_rank(r)
            offset_y = -95 * num_suit(s)
            print ".card-{0}{1} {{".format(s, r)
            print "    background-position: {0}px {1}px;".format(offset_x, offset_y)
            print "}"
