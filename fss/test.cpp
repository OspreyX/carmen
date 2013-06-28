

#include "geocoder/fss.hpp"
#include <iostream>

int main (int argc, char** argv)
{

    geocoder::fss_engine<> dict;
    dict.add("tall");
    dict.add("talker");
    dict.add("maker");

    {
        auto && r = dict.search("maker",2,5);
        std::for_each(r.begin(), r.end(), [] (std::pair<std::string,unsigned> const& p) { std::cerr << p.first << "[" << p.second << "]\n";} );
    }

    {
        auto && r = dict.search("talk",2,5);
        std::for_each(r.begin(), r.end(), [] (std::pair<std::string,unsigned> const& p) { std::cerr << p.first << "[" << p.second << "]\n";} );
    }

    {
        auto && r = dict.search("darker",2,5);
        std::for_each(r.begin(), r.end(), [] (std::pair<std::string,unsigned> const& p) { std::cerr << p.first << "[" << p.second << "]\n";} );
    }

    return EXIT_SUCCESS;
}
