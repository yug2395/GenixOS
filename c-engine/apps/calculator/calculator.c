#include "calculator.h"

#include <ctype.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define MAX_INPUT_LENGTH 256
#define MAX_TOKENS 128
#define MAX_STACK_SIZE 128
#define ERROR_MESSAGE_SIZE 128

typedef enum {
    TOKEN_NUMBER,
    TOKEN_OPERATOR,
    TOKEN_LPAREN,
    TOKEN_RPAREN,
    TOKEN_FUNCTION,
    TOKEN_INVALID
} TokenType;

typedef struct {
    TokenType type;
    double value;
    char op;
    char func[8];
} Token;

static void trim_trailing_newline(char *str);
static int tokenize(const char *expr, Token *tokens, size_t *token_count, char *error_message, size_t error_size);
static int to_rpn(const Token *tokens, size_t token_count, Token *output, size_t *output_count, char *error_message, size_t error_size);
static int evaluate_rpn(const Token *tokens, size_t token_count, double *result, char *error_message, size_t error_size);
static int precedence(char op);
static bool is_right_associative(char op);
static bool is_operator_token(const Token *token);
static bool is_function_token(const Token *token);
static double factorial(double n, int *error_flag);
static double degrees_to_radians(double value);
static void print_error(const char *message);

void calculator_run(void) {
    char input[MAX_INPUT_LENGTH];

    printf("Scientific Calculator (type 'exit' to return)\n");

    while (true) {
        printf("Enter expression: ");
        if (fgets(input, sizeof(input), stdin) == NULL) {
            print_error("Input error. Exiting calculator.");
            break;
        }

        trim_trailing_newline(input);

        if (strcmp(input, "exit") == 0) {
            printf("Calculator session ended.\n");
            break;
        }

        if (input[0] == '\0') {
            continue;
        }

        Token tokens[MAX_TOKENS];
        size_t token_count = 0;
        char error_message[ERROR_MESSAGE_SIZE] = {0};

        if (tokenize(input, tokens, &token_count, error_message, sizeof(error_message)) != 0) {
            print_error(error_message);
            continue;
        }

        Token rpn[MAX_TOKENS];
        size_t rpn_count = 0;

        if (to_rpn(tokens, token_count, rpn, &rpn_count, error_message, sizeof(error_message)) != 0) {
            print_error(error_message);
            continue;
        }

        double result = 0.0;
        if (evaluate_rpn(rpn, rpn_count, &result, error_message, sizeof(error_message)) != 0) {
            print_error(error_message);
            continue;
        }

        printf("Result: %.4f\n", result);
    }
}

static void trim_trailing_newline(char *str) {
    size_t len = strlen(str);
    if (len > 0 && (str[len - 1] == '\n' || str[len - 1] == '\r')) {
        str[len - 1] = '\0';
    }
}

static bool is_function_name(const char *token, char *out_func) {
    const char *functions[] = {"sin", "cos", "tan", "log", "sqrt", NULL};
    for (int i = 0; functions[i] != NULL; ++i) {
        if (strcmp(token, functions[i]) == 0) {
            strcpy(out_func, functions[i]);
            return true;
        }
    }
    return false;
}

static int tokenize(const char *expr, Token *tokens, size_t *token_count, char *error_message, size_t error_size) {
    size_t len = strlen(expr);
    size_t idx = 0;
    TokenType last_type = TOKEN_INVALID;

    while (idx < len) {
        if (isspace((unsigned char)expr[idx])) {
            ++idx;
            continue;
        }

        if (*token_count >= MAX_TOKENS) {
            snprintf(error_message, error_size, "Expression too long.");
            return -1;
        }

        if (isdigit((unsigned char)expr[idx]) || expr[idx] == '.') {
            char *endptr = NULL;
            double value = strtod(&expr[idx], &endptr);
            if (&expr[idx] == endptr) {
                snprintf(error_message, error_size, "Invalid number near position %zu.", idx);
                return -1;
            }

            tokens[*token_count].type = TOKEN_NUMBER;
            tokens[*token_count].value = value;
            tokens[*token_count].op = 0;
            tokens[*token_count].func[0] = '\0';
            (*token_count)++;
            idx = (size_t)(endptr - expr);
            last_type = TOKEN_NUMBER;
            continue;
        }

        if (isalpha((unsigned char)expr[idx])) {
            char buffer[8] = {0};
            size_t start = idx;
            size_t buf_idx = 0;

            while (idx < len && isalpha((unsigned char)expr[idx]) && buf_idx < sizeof(buffer) - 1) {
                buffer[buf_idx++] = (char)tolower((unsigned char)expr[idx]);
                ++idx;
            }
            buffer[buf_idx] = '\0';

            if (strcmp(buffer, "pi") == 0) {
                tokens[*token_count].type = TOKEN_NUMBER;
                tokens[*token_count].value = M_PI;
                tokens[*token_count].op = 0;
                tokens[*token_count].func[0] = '\0';
                (*token_count)++;
                last_type = TOKEN_NUMBER;
                continue;
            }

            if (is_function_name(buffer, tokens[*token_count].func)) {
                tokens[*token_count].type = TOKEN_FUNCTION;
                tokens[*token_count].value = 0.0;
                tokens[*token_count].op = 0;
                (*token_count)++;
                last_type = TOKEN_FUNCTION;
                continue;
            }

            snprintf(error_message, error_size, "Unknown token '%s' near position %zu.", buffer, start);
            return -1;
        }

        switch (expr[idx]) {
            case '+':
            case '-': {
                bool unary = (last_type == TOKEN_INVALID || last_type == TOKEN_OPERATOR ||
                              last_type == TOKEN_LPAREN || last_type == TOKEN_FUNCTION);
                if (unary && expr[idx] == '-') {
                    tokens[*token_count].type = TOKEN_FUNCTION;
                    strcpy(tokens[*token_count].func, "neg");
                    tokens[*token_count].value = 0.0;
                    tokens[*token_count].op = 0;
                } else if (unary && expr[idx] == '+') {
                    idx++;
                    continue;
                } else {
                    tokens[*token_count].type = TOKEN_OPERATOR;
                    tokens[*token_count].op = expr[idx];
                    tokens[*token_count].value = 0.0;
                    tokens[*token_count].func[0] = '\0';
                }
                (*token_count)++;
                idx++;
                last_type = tokens[*token_count - 1].type;
                break;
            }
            case '*':
            case '/':
            case '^': {
                tokens[*token_count].type = TOKEN_OPERATOR;
                tokens[*token_count].op = expr[idx];
                tokens[*token_count].value = 0.0;
                tokens[*token_count].func[0] = '\0';
                (*token_count)++;
                idx++;
                last_type = TOKEN_OPERATOR;
                break;
            }
            case '!': {
                tokens[*token_count].type = TOKEN_OPERATOR;
                tokens[*token_count].op = '!';
                tokens[*token_count].value = 0.0;
                tokens[*token_count].func[0] = '\0';
                (*token_count)++;
                idx++;
                last_type = TOKEN_OPERATOR;
                break;
            }
            case '(':
                tokens[*token_count].type = TOKEN_LPAREN;
                tokens[*token_count].op = 0;
                tokens[*token_count].value = 0.0;
                tokens[*token_count].func[0] = '\0';
                (*token_count)++;
                idx++;
                last_type = TOKEN_LPAREN;
                break;
            case ')':
                tokens[*token_count].type = TOKEN_RPAREN;
                tokens[*token_count].op = 0;
                tokens[*token_count].value = 0.0;
                tokens[*token_count].func[0] = '\0';
                (*token_count)++;
                idx++;
                last_type = TOKEN_RPAREN;
                break;
            default:
                snprintf(error_message, error_size, "Invalid character '%c' at position %zu.", expr[idx], idx);
                return -1;
        }
    }

    return 0;
}

static int precedence(char op) {
    switch (op) {
        case '!':
            return 4;
        case '^':
            return 3;
        case '*':
        case '/':
            return 2;
        case '+':
        case '-':
            return 1;
        default:
            return 0;
    }
}

static bool is_right_associative(char op) {
    return (op == '^' || op == '!');
}

static bool is_operator_token(const Token *token) {
    return token->type == TOKEN_OPERATOR;
}

static bool is_function_token(const Token *token) {
    return token->type == TOKEN_FUNCTION;
}

static int to_rpn(const Token *tokens, size_t token_count, Token *output, size_t *output_count, char *error_message, size_t error_size) {
    Token stack[MAX_STACK_SIZE];
    size_t stack_top = 0;
    *output_count = 0;

    for (size_t i = 0; i < token_count; ++i) {
        const Token *token = &tokens[i];

        if (token->type == TOKEN_NUMBER) {
            if (*output_count >= MAX_TOKENS) {
                snprintf(error_message, error_size, "Expression too complex.");
                return -1;
            }
            output[(*output_count)++] = *token;
        } else if (is_function_token(token)) {
            if (stack_top >= MAX_STACK_SIZE) {
                snprintf(error_message, error_size, "Expression too complex.");
                return -1;
            }
            stack[stack_top++] = *token;
        } else if (is_operator_token(token)) {
            while (stack_top > 0) {
                Token top = stack[stack_top - 1];
                if ((is_function_token(&top)) ||
                    (is_operator_token(&top) &&
                     ((precedence(top.op) > precedence(token->op)) ||
                      (precedence(top.op) == precedence(token->op) && !is_right_associative(token->op))))) {
                    if (*output_count >= MAX_TOKENS) {
                        snprintf(error_message, error_size, "Expression too complex.");
                        return -1;
                    }
                    output[(*output_count)++] = top;
                    --stack_top;
                } else {
                    break;
                }
            }
            if (stack_top >= MAX_STACK_SIZE) {
                snprintf(error_message, error_size, "Expression too complex.");
                return -1;
            }
            stack[stack_top++] = *token;
        } else if (token->type == TOKEN_LPAREN) {
            if (stack_top >= MAX_STACK_SIZE) {
                snprintf(error_message, error_size, "Expression too complex.");
                return -1;
            }
            stack[stack_top++] = *token;
        } else if (token->type == TOKEN_RPAREN) {
            bool matched = false;
            while (stack_top > 0) {
                Token top = stack[stack_top - 1];
                if (top.type == TOKEN_LPAREN) {
                    matched = true;
                    --stack_top;
                    break;
                }
                if (*output_count >= MAX_TOKENS) {
                    snprintf(error_message, error_size, "Expression too complex.");
                    return -1;
                }
                output[(*output_count)++] = top;
                --stack_top;
            }
            if (!matched) {
                snprintf(error_message, error_size, "Mismatched parentheses.");
                return -1;
            }

            if (stack_top > 0 && is_function_token(&stack[stack_top - 1])) {
                if (*output_count >= MAX_TOKENS) {
                    snprintf(error_message, error_size, "Expression too complex.");
                    return -1;
                }
                output[(*output_count)++] = stack[stack_top - 1];
                --stack_top;
            }
        }
    }

    while (stack_top > 0) {
        Token top = stack[--stack_top];
        if (top.type == TOKEN_LPAREN || top.type == TOKEN_RPAREN) {
            snprintf(error_message, error_size, "Mismatched parentheses.");
            return -1;
        }
        if (*output_count >= MAX_TOKENS) {
            snprintf(error_message, error_size, "Expression too complex.");
            return -1;
        }
        output[(*output_count)++] = top;
    }

    return 0;
}

static double factorial(double n, int *error_flag) {
    if (n < 0.0) {
        *error_flag = 1;
        return 0.0;
    }

    double rounded = floor(n + 0.5);
    if (fabs(n - rounded) > 1e-6) {
        *error_flag = 1;
        return 0.0;
    }

    if (rounded > 20.0) {
        *error_flag = 1;
        return 0.0;
    }

    unsigned int value = (unsigned int)rounded;
    double result = 1.0;
    for (unsigned int i = 2; i <= value; ++i) {
        result *= (double)i;
    }
    return result;
}

static double degrees_to_radians(double value) {
    return value * (M_PI / 180.0);
}

static int evaluate_rpn(const Token *tokens, size_t token_count, double *result, char *error_message, size_t error_size) {
    double stack[MAX_STACK_SIZE];
    size_t stack_top = 0;

    for (size_t i = 0; i < token_count; ++i) {
        const Token *token = &tokens[i];

        if (token->type == TOKEN_NUMBER) {
            if (stack_top >= MAX_STACK_SIZE) {
                snprintf(error_message, error_size, "Evaluation stack overflow.");
                return -1;
            }
            stack[stack_top++] = token->value;
        } else if (is_operator_token(token)) {
            if (token->op == '!') {
                if (stack_top < 1) {
                    snprintf(error_message, error_size, "Factorial requires an operand.");
                    return -1;
                }
                double operand = stack[stack_top - 1];
                int error_flag = 0;
                double value = factorial(operand, &error_flag);
                if (error_flag) {
                    snprintf(error_message, error_size, "Invalid input for factorial.");
                    return -1;
                }
                stack[stack_top - 1] = value;
                continue;
            }

            if (stack_top < 2) {
                snprintf(error_message, error_size, "Operator '%c' missing operands.", token->op);
                return -1;
            }

            double rhs = stack[--stack_top];
            double lhs = stack[stack_top - 1];
            double value = 0.0;

            switch (token->op) {
                case '+':
                    value = lhs + rhs;
                    break;
                case '-':
                    value = lhs - rhs;
                    break;
                case '*':
                    value = lhs * rhs;
                    break;
                case '/':
                    if (fabs(rhs) < 1e-12) {
                        snprintf(error_message, error_size, "Division by zero.");
                        return -1;
                    }
                    value = lhs / rhs;
                    break;
                case '^':
                    value = pow(lhs, rhs);
                    break;
                default:
                    snprintf(error_message, error_size, "Unknown operator '%c'.", token->op);
                    return -1;
            }

            stack[stack_top - 1] = value;
        } else if (is_function_token(token)) {
            if (stack_top < 1) {
                snprintf(error_message, error_size, "Function requires an operand.");
                return -1;
            }

            double operand = stack[stack_top - 1];
            double value = 0.0;

            if (strcmp(token->func, "sin") == 0) {
                value = sin(degrees_to_radians(operand));
            } else if (strcmp(token->func, "cos") == 0) {
                value = cos(degrees_to_radians(operand));
            } else if (strcmp(token->func, "tan") == 0) {
                double radians = degrees_to_radians(operand);
                double cosine = cos(radians);
                if (fabs(cosine) < 1e-12) {
                    snprintf(error_message, error_size, "Undefined tangent for %.4f degrees.", operand);
                    return -1;
                }
                value = tan(radians);
            } else if (strcmp(token->func, "log") == 0) {
                if (operand <= 0.0) {
                    snprintf(error_message, error_size, "Logarithm domain error.");
                    return -1;
                }
                value = log(operand);
            } else if (strcmp(token->func, "sqrt") == 0) {
                if (operand < 0.0) {
                    snprintf(error_message, error_size, "Square root of negative number.");
                    return -1;
                }
                value = sqrt(operand);
            } else if (strcmp(token->func, "neg") == 0) {
                value = -operand;
            } else {
                snprintf(error_message, error_size, "Unknown function '%s'.", token->func);
                return -1;
            }

            stack[stack_top - 1] = value;
        } else {
            snprintf(error_message, error_size, "Invalid token during evaluation.");
            return -1;
        }
    }

    if (stack_top != 1) {
        snprintf(error_message, error_size, "Invalid expression.");
        return -1;
    }

    *result = stack[0];
    return 0;
}

static void print_error(const char *message) {
    fprintf(stderr, "Error: %s\n", message);
}

