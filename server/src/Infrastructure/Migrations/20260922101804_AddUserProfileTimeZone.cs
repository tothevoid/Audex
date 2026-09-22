using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Audex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "UserProfile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                defaultValue: "Europe/Moscow");

            migrationBuilder.UpdateData(
                table: "UserProfile",
                keyColumn: "Id",
                keyValue: new Guid("9e2104a4-4b8d-4d4c-8585-0b24cf11e891"),
                column: "TimeZoneId",
                value: "Europe/Moscow");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "UserProfile");
        }
    }
}
