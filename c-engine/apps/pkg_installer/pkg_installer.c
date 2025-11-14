#include "pkg_installer.h"

#include "../../vfs.h"

#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define REGISTRY_PATH "system/lib_registry.txt"
#define INPUT_BUFFER_SIZE 256
#define INITIAL_LIBRARY_CAPACITY 16

typedef struct {
    char **items;
    size_t count;
    size_t capacity;
    bool dirty;
} LibraryList;

static void library_list_init(LibraryList *list);
static void library_list_free(LibraryList *list);
static bool library_list_reserve(LibraryList *list, size_t desired_capacity);
static bool library_list_contains(const LibraryList *list, const char *name);
static bool library_list_append(LibraryList *list, const char *name);
static bool library_list_remove(LibraryList *list, const char *name);
static void load_registry(LibraryList *list);
static void save_registry(const LibraryList *list);
static void run_interactive(LibraryList *list);
static void execute_command(LibraryList *list, const char *command_line, bool interactive);
static char *trim_whitespace(char *str);
static void to_lowercase_copy(const char *source, char *destination, size_t max_length);
static int string_case_compare(const char *a, const char *b);

void pkg_installer_run(const char *arguments) {
    LibraryList libraries;
    library_list_init(&libraries);
    load_registry(&libraries);

    if (arguments != NULL) {
        char buffer[INPUT_BUFFER_SIZE];
        strncpy(buffer, arguments, sizeof(buffer) - 1);
        buffer[sizeof(buffer) - 1] = '\0';
        trim_whitespace(buffer);
        if (buffer[0] != '\0') {
            execute_command(&libraries, buffer, false);
            if (libraries.dirty) {
                save_registry(&libraries);
            }
            library_list_free(&libraries);
            return;
        }
    }

    run_interactive(&libraries);
    if (libraries.dirty) {
        save_registry(&libraries);
    }
    library_list_free(&libraries);
}

static void library_list_init(LibraryList *list) {
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
    list->dirty = false;
}

static void library_list_free(LibraryList *list) {
    if (list->items != NULL) {
        for (size_t i = 0; i < list->count; ++i) {
            free(list->items[i]);
        }
    }
    free(list->items);
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
    list->dirty = false;
}

static bool library_list_reserve(LibraryList *list, size_t desired_capacity) {
    if (desired_capacity <= list->capacity) {
        return true;
    }
    size_t new_capacity = list->capacity == 0 ? INITIAL_LIBRARY_CAPACITY : list->capacity;
    while (new_capacity < desired_capacity) {
        new_capacity *= 2;
    }
    char **new_items = (char **)realloc(list->items, new_capacity * sizeof(char *));
    if (new_items == NULL) {
        printf("Failed to allocate memory for library registry.\n");
        return false;
    }
    list->items = new_items;
    list->capacity = new_capacity;
    return true;
}

static int string_case_compare(const char *a, const char *b) {
    while (*a && *b) {
        char ca = (char)tolower((unsigned char)*a);
        char cb = (char)tolower((unsigned char)*b);
        if (ca != cb) {
            return (int)(unsigned char)ca - (int)(unsigned char)cb;
        }
        ++a;
        ++b;
    }
    return (int)(unsigned char)tolower((unsigned char)*a) - (int)(unsigned char)tolower((unsigned char)*b);
}

static bool library_list_contains(const LibraryList *list, const char *name) {
    for (size_t i = 0; i < list->count; ++i) {
        if (string_case_compare(list->items[i], name) == 0) {
            return true;
        }
    }
    return false;
}

static bool library_list_append(LibraryList *list, const char *name) {
    if (library_list_contains(list, name)) {
        return false;
    }
    if (!library_list_reserve(list, list->count + 1)) {
        return false;
    }
    size_t length = strlen(name);
    char *stored = (char *)malloc(length + 1);
    if (stored == NULL) {
        printf("Unable to store library name.\n");
        return false;
    }
    memcpy(stored, name, length + 1);
    list->items[list->count++] = stored;
    list->dirty = true;
    return true;
}

static bool library_list_remove(LibraryList *list, const char *name) {
    for (size_t i = 0; i < list->count; ++i) {
        if (string_case_compare(list->items[i], name) == 0) {
            free(list->items[i]);
            for (size_t j = i; j + 1 < list->count; ++j) {
                list->items[j] = list->items[j + 1];
            }
            list->count--;
            list->dirty = true;
            return true;
        }
    }
    return false;
}

static void load_registry(LibraryList *list) {
    char buffer[INPUT_BUFFER_SIZE * 8];
    if (vfs_read(REGISTRY_PATH, buffer, sizeof(buffer)) != 0) {
        return;
    }

    char *context = NULL;
    char *line = strtok(buffer, "\n");
    while (line != NULL) {
        char *trimmed = trim_whitespace(line);
        if (trimmed[0] != '\0') {
            library_list_append(list, trimmed);
            list->dirty = false; // loading shouldn't mark as dirty
        }
        line = strtok(NULL, "\n");
    }
}

static void save_registry(const LibraryList *list) {
    size_t estimated_size = 1;
    for (size_t i = 0; i < list->count; ++i) {
        estimated_size += strlen(list->items[i]) + 1;
    }
    char *buffer = (char *)malloc(estimated_size);
    if (buffer == NULL) {
        printf("Failed to allocate memory while saving registry.\n");
        return;
    }

    buffer[0] = '\0';
    for (size_t i = 0; i < list->count; ++i) {
        strcat(buffer, list->items[i]);
        strcat(buffer, "\n");
    }

    if (vfs_write(REGISTRY_PATH, buffer) != 0) {
        printf("Failed to update registry at %s\n", REGISTRY_PATH);
    }

    free(buffer);
}

static char *trim_whitespace(char *str) {
    if (str == NULL) {
        return str;
    }
    while (isspace((unsigned char)*str)) {
        ++str;
    }
    char *end = str + strlen(str);
    while (end > str && isspace((unsigned char)*(end - 1))) {
        --end;
    }
    *end = '\0';
    return str;
}

static void to_lowercase_copy(const char *source, char *destination, size_t max_length) {
    size_t i = 0;
    for (; i + 1 < max_length && source[i] != '\0'; ++i) {
        destination[i] = (char)tolower((unsigned char)source[i]);
    }
    destination[i] = '\0';
}

static void print_library_list(const LibraryList *list) {
    if (list->count == 0) {
        printf("No libraries installed.\n");
        return;
    }
    printf("Installed libraries:\n");
    for (size_t i = 0; i < list->count; ++i) {
        printf("  - %s\n", list->items[i]);
    }
}

static void run_interactive(LibraryList *list) {
    printf("Package Installer (commands: install <name>, remove <name>, list, help, exit)\n");

    char input[INPUT_BUFFER_SIZE];
    while (true) {
        printf("pkg> ");
        if (fgets(input, sizeof(input), stdin) == NULL) {
            printf("\nInput error. Exiting package installer.\n");
            break;
        }

        char *command_line = trim_whitespace(input);
        if (command_line[0] == '\0') {
            continue;
        }

        if (string_case_compare(command_line, "exit") == 0) {
            printf("Package installer session ended.\n");
            break;
        }

        execute_command(list, command_line, true);
    }
}

static void execute_command(LibraryList *list, const char *command_line, bool interactive) {
    char buffer[INPUT_BUFFER_SIZE];
    strncpy(buffer, command_line, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    char *command = strtok(buffer, " ");
    if (command == NULL) {
        return;
    }

    char lowered[INPUT_BUFFER_SIZE];
    to_lowercase_copy(command, lowered, sizeof(lowered));

    if (strcmp(lowered, "install") == 0) {
        char *argument = strtok(NULL, "");
        if (argument == NULL) {
            printf("Usage: install <library>\n");
            return;
        }
        char *library_name = trim_whitespace(argument);
        if (library_name[0] == '\0') {
            printf("Library name cannot be empty.\n");
            return;
        }
        if (library_list_contains(list, library_name)) {
            printf("Library '%s' is already installed.\n", library_name);
            return;
        }
        if (library_list_append(list, library_name)) {
            printf("Installing library: %s\nDone.\n", library_name);
            if (!interactive) {
                save_registry(list);
                list->dirty = false;
            }
        }
    } else if (strcmp(lowered, "remove") == 0) {
        char *argument = strtok(NULL, "");
        if (argument == NULL) {
            printf("Usage: remove <library>\n");
            return;
        }
        char *library_name = trim_whitespace(argument);
        if (!library_list_remove(list, library_name)) {
            printf("Library '%s' is not installed.\n", library_name);
            return;
        }
        printf("Removed library: %s\n", library_name);
        if (!interactive) {
            save_registry(list);
            list->dirty = false;
        }
    } else if (strcmp(lowered, "list") == 0) {
        print_library_list(list);
    } else if (strcmp(lowered, "help") == 0) {
        printf("Commands: install <name>, remove <name>, list, help, exit\n");
    } else {
        printf("Unknown command: %s\n", command);
    }
}

