import re


def only_digits(value=""):
    return re.sub(r"\D", "", value or "")


def format_cpf(value=""):
    digits = only_digits(value)
    if not digits:
        return ""
    if len(digits) != 11:
        return value.strip()
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def format_phone(value=""):
    digits = only_digits(value)
    if not digits:
        return ""
    if len(digits) == 11:
        return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
    if len(digits) == 10:
        return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
    return value.strip()


def is_valid_cpf(value=""):
    digits = only_digits(value)
    if len(digits) != 11 or len(set(digits)) == 1:
        return False

    numbers = [int(digit) for digit in digits]
    for digit_index in [9, 10]:
        total = sum(numbers[index] * (digit_index + 1 - index) for index in range(digit_index))
        check_digit = (total * 10) % 11
        if check_digit == 10:
            check_digit = 0
        if numbers[digit_index] != check_digit:
            return False
    return True
