#ifndef SHELL_H
#define SHELL_H

void shell_init(void);
int shell_execute_command(const char *command, char *output, size_t output_size);

#endif // SHELL_H

