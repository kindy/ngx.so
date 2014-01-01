-- nginx like time parse
local _tmap = {
    y = 60 * 60 * 24 * 365,
    M = 60 * 60 * 24 * 30,
    w = 60 * 60 * 24 * 7,
    d = 60 * 60 * 24,
    h = 60 * 60,
    m = 60,
    s = 1,
}
function parse_time(s)
    local t = 0
    for n, u in string.gmatch(s, "(%d+)([yMwdhms])") do
        local x = tonumber(n) * assert(_tmap[u])
        t = t + x
    end

    return t
end

assert(parse_time("1h 30m") == 1 * 3600 + 30 * 60, "test 1")
assert(parse_time("2y 1h 30m") == 2 * 86400 * 365 + 1 * 3600 + 30 * 60, "test 2")
