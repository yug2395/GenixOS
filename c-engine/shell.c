#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>
#include "shell.h"
#include "apps/calculator/calculator.h"
#include "apps/calendar/calendar.h"
#include "apps/pkg_installer/pkg_installer.h"

static const char *skip_leading_whitespace(const char *input);
static void trim_trailing_whitespace(char *text);

void shell_init(void) {
    // Initialize shell environment
    // Set up signal handlers, etc.
}

int shell_execute_command(const char *command, char *output, size_t output_size) {
    // Parse and execute shell commands
    // This is a simplified version - full implementation would parse
    // commands like ls, cd, mkdir, etc.
    
    if (command == NULL || output == NULL || output_size == 0) {
        return -1;
    }

    output[0] = '\0';

    const char *trimmed_start = skip_leading_whitespace(command);
    char command_buffer[256];
    strncpy(command_buffer, trimmed_start, sizeof(command_buffer) - 1);
    command_buffer[sizeof(command_buffer) - 1] = '\0';
    trim_trailing_whitespace(command_buffer);

    if (command_buffer[0] == '\0') {
        return 0;
    }

    if (strcmp(command_buffer, "calc") == 0) {
        calculator_run();
        snprintf(output, output_size, "Calculator closed.\n");
        return 0;
    }

    if (strcmp(command_buffer, "calendar") == 0) {
        calendar_run();
        snprintf(output, output_size, "Calendar closed.\n");
        return 0;
    }

    if (strncmp(command_buffer, "pkg", 3) == 0 && (command_buffer[3] == '\0' || isspace((unsigned char)command_buffer[3]))) {
        const char *arguments = command_buffer + 3;
        arguments = skip_leading_whitespace(arguments);
        pkg_installer_run(arguments[0] != '\0' ? arguments : NULL);
        snprintf(output, output_size, "Package installer finished.\n");
        return 0;
    }

    if (strncmp(command, "ls", 2) == 0) {
        // Execute ls command
        FILE *fp = popen(command, "r");
        if (fp == NULL) {
            strncpy(output, "Error executing command", output_size);
            return -1;
        }
        
        size_t len = 0;
        char line[256];
        while (fgets(line, sizeof(line), fp) != NULL && len < output_size - 1) {
            size_t line_len = strlen(line);
            if (len + line_len < output_size) {
                strncpy(output + len, line, output_size - len);
                len += line_len;
            }
        }
        
        pclose(fp);
        return 0;
    }
    
    // Default: command not found
    snprintf(output, output_size, "%s: command not found\n", command);
    return -1;
}

static const char *skip_leading_whitespace(const char *input) {
    while (*input != '\0' && isspace((unsigned char)*input)) {
        ++input;
    }
    return input;
}

static void trim_trailing_whitespace(char *text) {
    size_t length = strlen(text);
    while (length > 0 && isspace((unsigned char)text[length - 1])) {
        text[--length] = '\0';
    }
}

