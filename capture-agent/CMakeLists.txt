cmake_minimum_required(VERSION 3.20)
project(rewind-capture-agent VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


if(WIN32)
    set(PCAP_ROOT "C:/Users/sreek/src/npcap-sdk-1.13/" CACHE PATH "Npcap SDK directory")
    
    message(STATUS "Using Npcap SDK at: ${PCAP_ROOT}")
    
    if(NOT EXISTS "${PCAP_ROOT}/Include/pcap.h")
        message(FATAL_ERROR "Npcap SDK not found at ${PCAP_ROOT}! Please install from https://npcap.com/")
    endif()
endif()

include(FetchContent)

message(STATUS "Fetching spdlog...")
FetchContent_Declare(
    spdlog
    GIT_REPOSITORY https://github.com/gabime/spdlog.git
    GIT_TAG v1.14.1
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(spdlog)

message(STATUS "Fetching PcapPlusPlus...")
FetchContent_Declare(
    PcapPlusPlus
    GIT_REPOSITORY https://github.com/seladb/PcapPlusPlus.git
    GIT_TAG v24.09
    GIT_SHALLOW TRUE
)

set(PCAPPP_BUILD_EXAMPLES OFF CACHE BOOL "Don't build examples")
set(PCAPPP_BUILD_TESTS OFF CACHE BOOL "Don't build tests")

FetchContent_MakeAvailable(PcapPlusPlus)

message(STATUS "Fetching nlohmann/json...")
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
    GIT_SHALLOW TRUE
)
FetchContent_MakeAvailable(json)

add_executable(capture-agent
 "src/main.cpp" "src/Capturer.cpp" "src/HttpMessage.cpp")

target_link_libraries(capture-agent
    PRIVATE
        spdlog::spdlog
        Pcap++
        Packet++
        Common++
        nlohmann_json::nlohmann_json 
)

target_include_directories(capture-agent
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
)

if(WIN32)
    target_link_libraries(capture-agent 
        PRIVATE 
            ws2_32      # Windows Sockets
            iphlpapi    # IP Helper API
    )
    
    set_target_properties(capture-agent PROPERTIES
        WIN32_EXECUTABLE FALSE
    )
    
    if(EXISTS "${PCAP_ROOT}/Lib/x64/wpcap.dll")
        add_custom_command(TARGET capture-agent POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                "${PCAP_ROOT}/Lib/x64/wpcap.dll"
                "$<TARGET_FILE_DIR:capture-agent>"
            COMMENT "Copying wpcap.dll to output directory"
        )
    endif()
    
    if(EXISTS "${PCAP_ROOT}/Lib/x64/Packet.dll")
        add_custom_command(TARGET capture-agent POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
                "${PCAP_ROOT}/Lib/x64/Packet.dll"
                "$<TARGET_FILE_DIR:capture-agent>"
            COMMENT "Copying Packet.dll to output directory"
        )
    endif()
endif()

message(STATUS "")
message(STATUS "========================================")
message(STATUS "Rewind Capture Agent Configuration")
message(STATUS "========================================")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")

if(WIN32)
    message(STATUS "Npcap SDK: ${PCAP_ROOT}")
endif()

message(STATUS "========================================")
