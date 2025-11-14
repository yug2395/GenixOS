CC = gcc
CFLAGS = -Wall -Wextra -std=c11
TARGET = genix_engine
SOURCES = main.c shell.c vfs.c \
	apps/calculator/calculator.c \
	apps/calendar/calendar.c \
	apps/pkg_installer/pkg_installer.c
OBJECTS = $(SOURCES:.c=.o)

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $(TARGET) $(OBJECTS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJECTS) $(TARGET)

