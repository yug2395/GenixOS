#include "calendar.h"

#include "../../vfs.h"

#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define EVENTS_STORAGE_PATH "home/user/events.txt"
#define MAX_DESCRIPTION_LENGTH 128
#define INPUT_BUFFER_SIZE 256
#define INITIAL_EVENT_CAPACITY 16
#define SAVE_BUFFER_SIZE 8192

typedef struct {
    int year;
    int month;
    int day;
    char description[MAX_DESCRIPTION_LENGTH];
} CalendarEvent;

typedef struct {
    CalendarEvent *items;
    size_t count;
    size_t capacity;
} EventList;

#if defined(_WIN32) || defined(_WIN64)
#define STRTOK(buffer, delimiters, context) strtok_s((buffer), (delimiters), (context))
#else
#define STRTOK(buffer, delimiters, context) strtok_r((buffer), (delimiters), (context))
#endif

static void event_list_init(EventList *list);
static void event_list_free(EventList *list);
static bool event_list_reserve(EventList *list, size_t desired_capacity);
static bool event_list_append(EventList *list, const CalendarEvent *event);
static void load_events(EventList *list);
static void save_events(const EventList *list);
static void display_calendar(int year, int month, const EventList *list);
static int days_in_month(int year, int month);
static bool is_leap_year(int year);
static const CalendarEvent *find_event_for_day(const EventList *list, int year, int month, int day, size_t *indices, size_t *match_count);
static void list_events_for_month(const EventList *list, int year, int month);
static void add_event(EventList *list, int default_year, int default_month);
static void edit_event(EventList *list);
static void delete_event(EventList *list);
static bool parse_date(const char *input, int *year, int *month, int *day);
static void to_lowercase(char *str);
static int parse_month_token(const char *token);
static void view_events(const EventList *list, int year, int month, const char *arg);

void calendar_run(void) {
    EventList events;
    event_list_init(&events);
    load_events(&events);

    time_t now = time(NULL);
    struct tm local_time;
#if defined(_WIN32) || defined(_WIN64)
    localtime_s(&local_time, &now);
#else
    localtime_r(&now, &local_time);
#endif

    int current_year = local_time.tm_year + 1900;
    int current_month = local_time.tm_mon + 1;

    printf("Calendar (type 'help' for commands, 'exit' to return)\n");
    display_calendar(current_year, current_month, &events);
    list_events_for_month(&events, current_year, current_month);

    char input[INPUT_BUFFER_SIZE];

    while (true) {
        printf("calendar> ");
        if (fgets(input, sizeof(input), stdin) == NULL) {
            printf("\nInput error. Exiting calendar.\n");
            break;
        }

        input[strcspn(input, "\r\n")] = '\0';

        if (input[0] == '\0') {
            continue;
        }

        char command_buffer[INPUT_BUFFER_SIZE];
        strncpy(command_buffer, input, sizeof(command_buffer) - 1);
        command_buffer[sizeof(command_buffer) - 1] = '\0';

        char *token = strtok(command_buffer, " ");
        if (token == NULL) {
            continue;
        }

        to_lowercase(token);

        if (strcmp(token, "exit") == 0) {
            printf("Exiting calendar.\n");
            break;
        } else if (strcmp(token, "help") == 0) {
            printf("Commands: add, edit, delete, view [day], next, prev, goto <month> <year>, help, exit\n");
        } else if (strcmp(token, "next") == 0) {
            current_month++;
            if (current_month > 12) {
                current_month = 1;
                current_year++;
            }
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "prev") == 0) {
            current_month--;
            if (current_month < 1) {
                current_month = 12;
                current_year--;
            }
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "goto") == 0) {
            char *month_token = strtok(NULL, " ");
            char *year_token = strtok(NULL, " ");
            if (month_token == NULL || year_token == NULL) {
                printf("Usage: goto <month> <year>\n");
                continue;
            }
            to_lowercase(month_token);
            int month_value = parse_month_token(month_token);
            int year_value = atoi(year_token);
            if (month_value < 1 || month_value > 12 || year_value < 1) {
                printf("Invalid month/year combination.\n");
                continue;
            }
            current_month = month_value;
            current_year = year_value;
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "add") == 0) {
            add_event(&events, current_year, current_month);
            save_events(&events);
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "edit") == 0) {
            edit_event(&events);
            save_events(&events);
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "delete") == 0) {
            delete_event(&events);
            save_events(&events);
            display_calendar(current_year, current_month, &events);
            list_events_for_month(&events, current_year, current_month);
        } else if (strcmp(token, "view") == 0) {
            char *arg = strtok(NULL, " ");
            view_events(&events, current_year, current_month, arg);
        } else {
            printf("Unknown command: %s\n", token);
        }
    }

    event_list_free(&events);
}

static void event_list_init(EventList *list) {
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
}

static void event_list_free(EventList *list) {
    free(list->items);
    list->items = NULL;
    list->count = 0;
    list->capacity = 0;
}

static bool event_list_reserve(EventList *list, size_t desired_capacity) {
    if (desired_capacity <= list->capacity) {
        return true;
    }
    size_t new_capacity = list->capacity == 0 ? INITIAL_EVENT_CAPACITY : list->capacity;
    while (new_capacity < desired_capacity) {
        new_capacity *= 2;
    }
    CalendarEvent *new_items = (CalendarEvent *)realloc(list->items, new_capacity * sizeof(CalendarEvent));
    if (new_items == NULL) {
        printf("Failed to allocate memory for events.\n");
        return false;
    }
    list->items = new_items;
    list->capacity = new_capacity;
    return true;
}

static bool event_list_append(EventList *list, const CalendarEvent *event) {
    if (!event_list_reserve(list, list->count + 1)) {
        return false;
    }
    list->items[list->count++] = *event;
    return true;
}

static void load_events(EventList *list) {
    char buffer[SAVE_BUFFER_SIZE];
    if (vfs_read(EVENTS_STORAGE_PATH, buffer, sizeof(buffer)) != 0) {
        return;
    }

    char *context = NULL;
    char *line = STRTOK(buffer, "\n", &context);
    while (line != NULL) {
        if (line[0] != '\0') {
            CalendarEvent event;
            char description[MAX_DESCRIPTION_LENGTH] = {0};
            if (sscanf(line, "%d-%d-%d|%127[^\n]", &event.year, &event.month, &event.day, description) == 4) {
                strncpy(event.description, description, sizeof(event.description) - 1);
                event.description[sizeof(event.description) - 1] = '\0';
                event_list_append(list, &event);
            }
        }
        line = STRTOK(NULL, "\n", &context);
    }
}

static void save_events(const EventList *list) {
    size_t buffer_capacity = SAVE_BUFFER_SIZE;
    if (list->count * (MAX_DESCRIPTION_LENGTH + 16) > buffer_capacity) {
        buffer_capacity = list->count * (MAX_DESCRIPTION_LENGTH + 16);
    }

    char *buffer = (char *)calloc(buffer_capacity, sizeof(char));
    if (buffer == NULL) {
        printf("Failed to allocate memory while saving events.\n");
        return;
    }

    size_t offset = 0;
    for (size_t i = 0; i < list->count; ++i) {
        const CalendarEvent *event = &list->items[i];
        int written = snprintf(buffer + offset, buffer_capacity - offset, "%04d-%02d-%02d|%s\n",
                               event->year, event->month, event->day, event->description);
        if (written < 0 || (size_t)written >= buffer_capacity - offset) {
            free(buffer);
            printf("Failed to serialize events (buffer overflow).\n");
            return;
        }
        offset += (size_t)written;
    }

    if (vfs_write(EVENTS_STORAGE_PATH, buffer) != 0) {
        printf("Failed to write events to %s\n", EVENTS_STORAGE_PATH);
    }

    free(buffer);
}

static const char *month_name(int month) {
    static const char *names[] = {"January", "February", "March",     "April",
                                  "May",     "June",     "July",      "August",
                                  "September", "October", "November", "December"};
    if (month < 1 || month > 12) {
        return "Unknown";
    }
    return names[month - 1];
}

static void display_calendar(int year, int month, const EventList *list) {
    struct tm first_day = {0};
    first_day.tm_year = year - 1900;
    first_day.tm_mon = month - 1;
    first_day.tm_mday = 1;
    mktime(&first_day);

    int first_weekday = (first_day.tm_wday + 6) % 7; // convert to Monday=0
    int total_days = days_in_month(year, month);

    printf("\n%s %d\n", month_name(month), year);
    printf("Mo Tu We Th Fr Sa Su\n");

    int day_counter = 1;

    for (int i = 0; i < first_weekday; ++i) {
        printf("   ");
    }

    while (day_counter <= total_days) {
        int weekday = (first_weekday + day_counter - 1) % 7;
        bool has_event = false;
        for (size_t i = 0; i < list->count; ++i) {
            const CalendarEvent *event = &list->items[i];
            if (event->year == year && event->month == month && event->day == day_counter) {
                has_event = true;
                break;
            }
        }
        printf("%2d%c", day_counter, has_event ? '*' : ' ');

        if (weekday == 6 || day_counter == total_days) {
            printf("\n");
        } else {
            printf(" ");
        }

        day_counter++;
    }
    printf("\n");
}

static int days_in_month(int year, int month) {
    static const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (month == 2 && is_leap_year(year)) {
        return 29;
    }
    if (month < 1 || month > 12) {
        return 30;
    }
    return days[month - 1];
}

static bool is_leap_year(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

static const CalendarEvent *find_event_for_day(const EventList *list, int year, int month, int day, size_t *indices, size_t *match_count) {
    *match_count = 0;
    for (size_t i = 0; i < list->count; ++i) {
        const CalendarEvent *event = &list->items[i];
        if (event->year == year && event->month == month && event->day == day) {
            if (indices != NULL) {
                indices[*match_count] = i;
            }
            (*match_count)++;
        }
    }
    if (*match_count > 0 && indices != NULL) {
        return &list->items[indices[0]];
    }
    return NULL;
}

static void list_events_for_month(const EventList *list, int year, int month) {
    printf("Events for %s %d:\n", month_name(month), year);
    bool any = false;
    for (size_t i = 0; i < list->count; ++i) {
        const CalendarEvent *event = &list->items[i];
        if (event->year == year && event->month == month) {
            printf("  %02d: %s\n", event->day, event->description);
            any = true;
        }
    }
    if (!any) {
        printf("  (no events)\n");
    }
}

static void add_event(EventList *list, int default_year, int default_month) {
    char buffer[INPUT_BUFFER_SIZE];
    printf("Enter date (YYYY-MM-DD) [default %04d-%02d-<day>]: ", default_year, default_month);
    if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
        printf("Input cancelled.\n");
        return;
    }
    buffer[strcspn(buffer, "\r\n")] = '\0';

    int year = default_year;
    int month = default_month;
    int day = -1;

    if (buffer[0] == '\0') {
        printf("Enter day (1-31): ");
        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            printf("Input cancelled.\n");
            return;
        }
        day = atoi(buffer);
    } else {
        if (!parse_date(buffer, &year, &month, &day)) {
            printf("Invalid date format.\n");
            return;
        }
    }

    if (day < 1 || day > days_in_month(year, month)) {
        printf("Invalid day for the specified month/year.\n");
        return;
    }

    printf("Enter description: ");
    if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
        printf("Input cancelled.\n");
        return;
    }
    buffer[strcspn(buffer, "\r\n")] = '\0';

    if (buffer[0] == '\0') {
        printf("Description cannot be empty.\n");
        return;
    }

    CalendarEvent event = {.year = year, .month = month, .day = day};
    strncpy(event.description, buffer, sizeof(event.description) - 1);
    event.description[sizeof(event.description) - 1] = '\0';

    if (event_list_append(list, &event)) {
        printf("Event added for %04d-%02d-%02d.\n", year, month, day);
    }
}

static void edit_event(EventList *list) {
    if (list->count == 0) {
        printf("No events to edit.\n");
        return;
    }

    char buffer[INPUT_BUFFER_SIZE];
    printf("Enter date of event to edit (YYYY-MM-DD): ");
    if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
        printf("Input cancelled.\n");
        return;
    }
    buffer[strcspn(buffer, "\r\n")] = '\0';

    int year, month, day;
    if (!parse_date(buffer, &year, &month, &day)) {
        printf("Invalid date format.\n");
        return;
    }

    size_t indices[16];
    size_t matches = 0;
    find_event_for_day(list, year, month, day, indices, &matches);
    if (matches == 0) {
        printf("No events found on %04d-%02d-%02d.\n", year, month, day);
        return;
    }

    size_t selected = 0;
    if (matches > 1) {
        printf("Select event to edit:\n");
        for (size_t i = 0; i < matches; ++i) {
            printf("  %zu) %s\n", i + 1, list->items[indices[i]].description);
        }
        printf("Choice (1-%zu): ", matches);
        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            printf("Input cancelled.\n");
            return;
        }
        selected = (size_t)atoi(buffer);
        if (selected < 1 || selected > matches) {
            printf("Invalid selection.\n");
            return;
        }
        selected--;
    }

    CalendarEvent *event = &list->items[indices[selected]];
    printf("Current description: %s\n", event->description);
    printf("Enter new description: ");
    if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
        printf("Input cancelled.\n");
        return;
    }
    buffer[strcspn(buffer, "\r\n")] = '\0';
    if (buffer[0] == '\0') {
        printf("Description cannot be empty.\n");
        return;
    }
    strncpy(event->description, buffer, sizeof(event->description) - 1);
    event->description[sizeof(event->description) - 1] = '\0';
    printf("Event updated.\n");
}

static void delete_event(EventList *list) {
    if (list->count == 0) {
        printf("No events to delete.\n");
        return;
    }

    char buffer[INPUT_BUFFER_SIZE];
    printf("Enter date of event to delete (YYYY-MM-DD): ");
    if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
        printf("Input cancelled.\n");
        return;
    }
    buffer[strcspn(buffer, "\r\n")] = '\0';

    int year, month, day;
    if (!parse_date(buffer, &year, &month, &day)) {
        printf("Invalid date format.\n");
        return;
    }

    size_t indices[16];
    size_t matches = 0;
    find_event_for_day(list, year, month, day, indices, &matches);
    if (matches == 0) {
        printf("No events found on %04d-%02d-%02d.\n", year, month, day);
        return;
    }

    size_t selected = 0;
    if (matches > 1) {
        printf("Select event to delete:\n");
        for (size_t i = 0; i < matches; ++i) {
            printf("  %zu) %s\n", i + 1, list->items[indices[i]].description);
        }
        printf("Choice (1-%zu): ", matches);
        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            printf("Input cancelled.\n");
            return;
        }
        selected = (size_t)atoi(buffer);
        if (selected < 1 || selected > matches) {
            printf("Invalid selection.\n");
            return;
        }
        selected--;
    }

    size_t remove_index = indices[selected];
    for (size_t i = remove_index; i + 1 < list->count; ++i) {
        list->items[i] = list->items[i + 1];
    }
    list->count--;
    printf("Event removed.\n");
}

static bool parse_date(const char *input, int *year, int *month, int *day) {
    if (sscanf(input, "%d-%d-%d", year, month, day) != 3) {
        return false;
    }
    if (*year < 1 || *month < 1 || *month > 12 || *day < 1 || *day > 31) {
        return false;
    }
    return true;
}

static void to_lowercase(char *str) {
    while (*str) {
        *str = (char)tolower((unsigned char)*str);
        ++str;
    }
}

static int parse_month_token(const char *token) {
    if (token == NULL) {
        return -1;
    }

    if (strlen(token) <= 2 && isdigit((unsigned char)token[0])) {
        int value = atoi(token);
        if (value >= 1 && value <= 12) {
            return value;
        }
    }

    const char *names[] = {"january", "february", "march",     "april",
                           "may",     "june",     "july",       "august",
                           "september", "october", "november", "december"};

    for (int i = 0; i < 12; ++i) {
        if (strncmp(names[i], token, strlen(token)) == 0) {
            return i + 1;
        }
    }
    return -1;
}

static void view_events(const EventList *list, int year, int month, const char *arg) {
    if (arg == NULL) {
        list_events_for_month(list, year, month);
        return;
    }

    if (isdigit((unsigned char)arg[0])) {
        int day = atoi(arg);
        if (day < 1 || day > days_in_month(year, month)) {
            printf("Invalid day for the current month.\n");
            return;
        }
        size_t indices[16];
        size_t matches = 0;
        find_event_for_day(list, year, month, day, indices, &matches);
        if (matches == 0) {
            printf("No events on %04d-%02d-%02d.\n", year, month, day);
            return;
        }
        printf("Events on %04d-%02d-%02d:\n", year, month, day);
        for (size_t i = 0; i < matches; ++i) {
            printf("  - %s\n", list->items[indices[i]].description);
        }
        return;
    }

    int year_val = 0, month_val = 0, day_val = 0;
    if (parse_date(arg, &year_val, &month_val, &day_val)) {
        size_t indices[16];
        size_t matches = 0;
        find_event_for_day(list, year_val, month_val, day_val, indices, &matches);
        if (matches == 0) {
            printf("No events on %04d-%02d-%02d.\n", year_val, month_val, day_val);
            return;
        }
        printf("Events on %04d-%02d-%02d:\n", year_val, month_val, day_val);
        for (size_t i = 0; i < matches; ++i) {
            printf("  - %s\n", list->items[indices[i]].description);
        }
    } else {
        printf("Unrecognized view argument. Use 'view', 'view <day>', or 'view YYYY-MM-DD'.\n");
    }
}

