use core::fmt;

/// This enum describes the seven basic types of codepoints.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum CodepointType {
    /// Letter, mark, number, punctuation, symbol, and spaces
    Graphic,
    /// Invisible but affects neighboring characters; includes line/paragraph separators
    Format,
    /// Usage defined by protocols or standards outside the Unicode Standard
    Control,
    /// Usage defined by private agreement outside the Unicode Standard
    PrivateUse,
    /// Permanently reserved for UTF-16; restricted interchange
    Surrogate,
    /// Permanently reserved for internal usage; restricted interchange
    Noncharacter,
    /// Reserved for future assignment; restricted interchange
    Reserved,
}

impl fmt::Display for CodepointType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            match self {
                CodepointType::Graphic => "Graphic",
                CodepointType::Format => "Format",
                CodepointType::Control => "Control",
                CodepointType::PrivateUse => "Private-use",
                CodepointType::Surrogate => "Surrogate",
                CodepointType::Noncharacter => "Noncharacter",
                CodepointType::Reserved => "Reserved",
            }
        )
    }
}
