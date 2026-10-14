using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Audex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameCryptoAccountCryptocurrencyToCryptoAsset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "CryptoAccountCryptocurrency",
                newName: "CryptoAsset");

            migrationBuilder.RenameIndex(
                name: "IX_CryptoAccountCryptocurrency_CryptoAccountId",
                table: "CryptoAsset",
                newName: "IX_CryptoAsset_CryptoAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_CryptoAccountCryptocurrency_CryptocurrencyId",
                table: "CryptoAsset",
                newName: "IX_CryptoAsset_CryptocurrencyId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_CryptoAsset_CryptoAccountId",
                table: "CryptoAsset",
                newName: "IX_CryptoAccountCryptocurrency_CryptoAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_CryptoAsset_CryptocurrencyId",
                table: "CryptoAsset",
                newName: "IX_CryptoAccountCryptocurrency_CryptocurrencyId");

            migrationBuilder.RenameTable(
                name: "CryptoAsset",
                newName: "CryptoAccountCryptocurrency");
        }
    }
}
