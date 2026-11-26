using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Audex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddActiveToDataDictionaries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "CryptoProvider",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "BrokerAccountType",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "Broker",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Active",
                table: "Bank",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Active",
                table: "CryptoProvider");

            migrationBuilder.DropColumn(
                name: "Active",
                table: "BrokerAccountType");

            migrationBuilder.DropColumn(
                name: "Active",
                table: "Broker");

            migrationBuilder.DropColumn(
                name: "Active",
                table: "Bank");
        }
    }
}
