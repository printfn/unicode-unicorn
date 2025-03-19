use crate::codepoint_type::CodepointType;
use core::str::FromStr;

/// Values for the General_Category (gc) character property.
/// These values are fixed; no new values will be added.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum GeneralCategory {
    /// Letter, uppercase
    Lu,
    /// Letter, lowercase
    Ll,
    /// Letter, titlecase
    Lt,
    /// Letter, modifier
    Lm,
    /// Letter, other
    Lo,
    /// Mark, nonspacing
    Mn,
    /// Mark, spacing combining
    Mc,
    /// Mark, enclosing
    Me,
    /// Number, decimal digit
    Nd,
    /// Number, letter
    Nl,
    /// Number, other
    No,
    /// Punctuation, connector
    Pc,
    /// Punctuation, dash
    Pd,
    /// Punctuation, open
    Ps,
    /// Punctuation, close
    Pe,
    /// Punctuation, initial quote
    Pi,
    /// Punctuation, final quote
    Pf,
    /// Punctuation, other
    Po,
    /// Symbol, math
    Sm,
    /// Symbol, currency
    Sc,
    /// Symbol, modifier
    Sk,
    /// Symbol, other
    So,
    /// Separator, space
    Zs,
    /// Separator, line
    Zl,
    /// Separator, paragraph
    Zp,
    /// Other, control
    Cc,
    /// Other, format
    Cf,
    /// Other, surrogate
    Cs,
    /// Other, private use
    Co,
    /// Other, not assigned
    Cn,
}

impl GeneralCategory {
    pub fn codepoint_type(self, codepoint: u32) -> CodepointType {
        match self {
            GeneralCategory::Cc => CodepointType::Control,
            GeneralCategory::Co => CodepointType::PrivateUse,
            GeneralCategory::Cs => CodepointType::Surrogate,
            GeneralCategory::Cf | GeneralCategory::Zl | GeneralCategory::Zp => {
                CodepointType::Format
            }
            GeneralCategory::Cn => match codepoint {
                0x00_fdd0..=0x00_fdef => CodepointType::Noncharacter,
                0x00_fffe..=0x00_ffff => CodepointType::Noncharacter,
                0x01_fffe..=0x01_ffff => CodepointType::Noncharacter,
                0x02_fffe..=0x02_ffff => CodepointType::Noncharacter,
                0x03_fffe..=0x03_ffff => CodepointType::Noncharacter,
                0x04_fffe..=0x04_ffff => CodepointType::Noncharacter,
                0x05_fffe..=0x05_ffff => CodepointType::Noncharacter,
                0x06_fffe..=0x06_ffff => CodepointType::Noncharacter,
                0x07_fffe..=0x07_ffff => CodepointType::Noncharacter,
                0x08_fffe..=0x08_ffff => CodepointType::Noncharacter,
                0x09_fffe..=0x09_ffff => CodepointType::Noncharacter,
                0x0a_fffe..=0x0a_ffff => CodepointType::Noncharacter,
                0x0b_fffe..=0x0b_ffff => CodepointType::Noncharacter,
                0x0c_fffe..=0x0c_ffff => CodepointType::Noncharacter,
                0x0d_fffe..=0x0d_ffff => CodepointType::Noncharacter,
                0x0e_fffe..=0x0e_ffff => CodepointType::Noncharacter,
                0x0f_fffe..=0x0f_ffff => CodepointType::Noncharacter,
                0x10_fffe..=0x10_ffff => CodepointType::Noncharacter,
                _ => CodepointType::Reserved,
            },
            _ => CodepointType::Graphic,
        }
    }
}

impl FromStr for GeneralCategory {
    type Err = ();

    fn from_str(s: &str) -> Result<GeneralCategory, ()> {
        match s {
            "Lu" => Ok(GeneralCategory::Lu),
            "Ll" => Ok(GeneralCategory::Ll),
            "Lt" => Ok(GeneralCategory::Lt),
            "Lm" => Ok(GeneralCategory::Lm),
            "Lo" => Ok(GeneralCategory::Lo),
            "Mn" => Ok(GeneralCategory::Mn),
            "Mc" => Ok(GeneralCategory::Mc),
            "Me" => Ok(GeneralCategory::Me),
            "Nd" => Ok(GeneralCategory::Nd),
            "Nl" => Ok(GeneralCategory::Nl),
            "No" => Ok(GeneralCategory::No),
            "Pc" => Ok(GeneralCategory::Pc),
            "Pd" => Ok(GeneralCategory::Pd),
            "Ps" => Ok(GeneralCategory::Ps),
            "Pe" => Ok(GeneralCategory::Pe),
            "Pi" => Ok(GeneralCategory::Pi),
            "Pf" => Ok(GeneralCategory::Pf),
            "Po" => Ok(GeneralCategory::Po),
            "Sm" => Ok(GeneralCategory::Sm),
            "Sc" => Ok(GeneralCategory::Sc),
            "Sk" => Ok(GeneralCategory::Sk),
            "So" => Ok(GeneralCategory::So),
            "Zs" => Ok(GeneralCategory::Zs),
            "Zl" => Ok(GeneralCategory::Zl),
            "Zp" => Ok(GeneralCategory::Zp),
            "Cc" => Ok(GeneralCategory::Cc),
            "Cf" => Ok(GeneralCategory::Cf),
            "Cs" => Ok(GeneralCategory::Cs),
            "Co" => Ok(GeneralCategory::Co),
            "Cn" => Ok(GeneralCategory::Cn),
            _ => Err(()),
        }
    }
}

#[cfg(test)]
mod test {
    #[test]
    fn category_name() {
        assert_eq!(
            crate::long_category_name_for_short_name("Lu").unwrap(),
            "Uppercase_Letter"
        );
        assert_eq!(
            crate::long_category_name_for_short_name("Sc").unwrap(),
            "Currency_Symbol"
        );
    }
}
